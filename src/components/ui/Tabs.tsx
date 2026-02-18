import * as React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

function Tabs({ defaultValue = 'login', value: controlledValue, onValueChange, children }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;
  
  const handleValueChange = React.useCallback((newValue: string) => {
    if (isControlled) {
      onValueChange?.(newValue);
    } else {
      setInternalValue(newValue);
    }
  }, [isControlled, onValueChange]);

  const contextValue = React.useMemo(
    () => ({ value: currentValue, onValueChange: handleValueChange }),
    [currentValue, handleValueChange]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <View style={styles.container}>{children}</View>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

function TabsList({ children }: TabsListProps) {
  return (
    <View style={styles.tabsList}>
      {children}
    </View>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function TabsTrigger({ value, children }: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  
  if (!context) {
    return (
      <View style={[styles.tabTrigger, styles.tabTriggerDisabled]}>
        <Text style={styles.tabTriggerTextInactive}>{children}</Text>
      </View>
    );
  }

  const isActive = context.value === value;

  return (
    <TouchableOpacity
      onPress={() => context.onValueChange(value)}
      style={[
        styles.tabTrigger,
        isActive && styles.tabTriggerActive,
      ]}
      activeOpacity={0.7}
    >
      <Text style={isActive ? styles.tabTriggerTextActive : styles.tabTriggerTextInactive}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function TabsContent({ value, children }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  
  if (!context || context.value !== value) {
    return null;
  }

  return (
    <View style={styles.tabContent}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tabsList: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(115, 115, 115, 0.2)',
    padding: 4,
    marginBottom: 32,
  },
  tabTrigger: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  tabTriggerActive: {
    backgroundColor: '#1c1c1c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  tabTriggerDisabled: {
    opacity: 0.5,
  },
  tabTriggerTextActive: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  tabTriggerTextInactive: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  tabContent: {
    marginTop: 8,
  },
});

export { Tabs, TabsList, TabsTrigger, TabsContent };
