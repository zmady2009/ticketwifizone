import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'success';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', asChild = false, children, ...props }, ref) => {
    const buttonClass = cn(
      'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      {
        'bg-brand-600 text-white hover:bg-brand-700': variant === 'default',
        'border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50': variant === 'outline',
        'text-gray-700 hover:bg-gray-100': variant === 'ghost',
        'bg-red-600 text-white hover:bg-red-700': variant === 'destructive',
        'bg-green-600 text-white hover:bg-green-700': variant === 'success',
        'h-9 px-4 text-sm': size === 'sm',
        'h-11 px-6 text-base': size === 'md',
        'h-13 px-8 text-lg': size === 'lg',
      },
      className
    );

    // Si asChild est true, on applique les classes au premier enfant
    if (asChild && React.isValidElement(children)) {
      const childProps = children.props as Record<string, unknown>;
      return React.cloneElement(children, {
        className: cn(buttonClass, childProps.className as string),
        ...props,
      } as any);
    }

    return (
      <button
        className={buttonClass}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
