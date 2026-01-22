import * as React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const Tabs = ({ defaultValue = 'login', value: controlledValue, onValueChange, children, className }: TabsProps) => {
  // Initialize state with defaultValue
  const [internalValue, setInternalValue] = React.useState(defaultValue || 'login');
  
  // Use controlled value if provided, otherwise use internal state
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? (controlledValue || defaultValue || 'login') : internalValue;
  
  const handleValueChange = React.useCallback((newValue: string) => {
    if (isControlled) {
      // If controlled, call the parent's onValueChange
      onValueChange?.(newValue);
    } else {
      // If uncontrolled, update internal state
      setInternalValue(newValue);
    }
  }, [isControlled, onValueChange]);

  // Create context value with useMemo to ensure stability
  const contextValue: TabsContextValue = React.useMemo(
    () => ({
      value: currentValue,
      onValueChange: handleValueChange,
    }),
    [currentValue, handleValueChange]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <View className={cn('w-full', className)}>{children}</View>
    </TabsContext.Provider>
  );
};
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef<View, React.ComponentProps<typeof View>>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn('flex flex-row items-center justify-center rounded-md bg-muted p-1', className)}
      {...props}
    />
  ),
);
TabsList.displayName = 'TabsList';

interface TabsTriggerProps extends Omit<React.ComponentProps<typeof TouchableOpacity>, 'children'> {
  value: string;
  children: React.ReactNode;
}

const TabsTrigger = React.forwardRef<View, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    
    // If context is not available, render a disabled button
    if (!context) {
      console.warn('TabsTrigger must be used within a Tabs component');
      return (
        <TouchableOpacity
          ref={ref as any}
          className={cn('flex-1 items-center justify-center rounded-sm px-3 py-1.5 opacity-50', className)}
          activeOpacity={0.7}
          disabled
          {...props}
        >
          <Text className="text-base font-medium text-muted-foreground" style={{ fontSize: 16 }}>
            {children}
          </Text>
        </TouchableOpacity>
      );
    }

    const isActive = context.value === value;

    const handlePress = React.useCallback(() => {
      if (context?.onValueChange) {
        context.onValueChange(value);
      }
    }, [context, value]);

    return (
      <TouchableOpacity
        ref={ref as any}
        onPress={handlePress}
        className={cn(
          'flex-1 items-center justify-center rounded-sm px-3 py-1.5',
          isActive && 'bg-background shadow-sm',
          className,
        )}
        activeOpacity={0.7}
        {...props}
      >
        <Text
          className={cn(
            'text-base font-medium',
            isActive ? 'text-foreground' : 'text-muted-foreground',
          )}
          style={{ fontSize: 16 }}
        >
          {children}
        </Text>
      </TouchableOpacity>
    );
  },
);
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef<View, React.ComponentProps<typeof View> & { value: string }>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    
    if (!context) {
      console.error('TabsContent must be used within a Tabs component');
      return null;
    }

    if (context.value !== value) return null;

    return (
      <View ref={ref} className={cn('mt-2', className)} {...props}>
        {children}
      </View>
    );
  },
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
