import * as React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'flex-row items-center justify-center gap-2 rounded-md font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        destructive: 'bg-destructive',
        outline: 'border border-input bg-background',
        secondary: 'bg-secondary',
        ghost: 'bg-transparent',
        link: 'bg-transparent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends Omit<React.ComponentProps<typeof TouchableOpacity>, 'children'>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<View, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    // Ensure boolean values are explicit
    const isDisabled = Boolean(disabled || loading);
    const isLoading = Boolean(loading);
    
    // Filter out className and variant/size from props to avoid conflicts
    const { className: _, variant: __, size: ___, ...nativeProps } = props as any;
    
    return (
      <TouchableOpacity
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={isDisabled}
        activeOpacity={0.7}
        {...nativeProps}
      >
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'outline' || variant === 'ghost' ? undefined : 'white'}
          />
        ) : (
          <View className="flex-row items-center justify-center">
            {typeof children === 'string' ? (
              <Text
                className={cn(
                  'text-base font-semibold',
                  variant === 'default' && 'text-primary-foreground',
                  variant === 'destructive' && 'text-destructive-foreground',
                  variant === 'outline' && 'text-foreground',
                  variant === 'secondary' && 'text-secondary-foreground',
                  variant === 'ghost' && 'text-foreground',
                  variant === 'link' && 'text-primary underline',
                  isDisabled && 'opacity-50',
                )}
                style={{ fontSize: 16 }}
              >
                {children}
              </Text>
            ) : (
              children
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };

