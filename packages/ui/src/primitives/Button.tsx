import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
        secondary:
          'border border-surface-200 bg-surface-100 text-surface-700 hover:bg-surface-200 active:bg-surface-300',
        ghost:
          'bg-transparent text-brand-600 hover:bg-surface-50 active:bg-surface-100',
        danger:
          'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
        'danger-ghost':
          'bg-transparent text-red-600 hover:bg-red-50 active:bg-red-100',
        icon: 'bg-transparent hover:bg-surface-100 active:bg-surface-200 rounded-md',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-9 px-4 text-sm',
        lg: 'h-10 px-5 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'icon',
        size: 'sm',
        class: 'h-8 w-8 p-0',
      },
      {
        variant: 'icon',
        size: 'md',
        class: 'h-9 w-9 p-0',
      },
      {
        variant: 'icon',
        size: 'lg',
        class: 'h-10 w-10 p-0',
      },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** When true, merges props onto the child element instead of rendering a <button> */
  asChild?: boolean;
  /** Shows a loading spinner and disables the button */
  loading?: boolean;
  /** Left icon slot */
  icon?: React.ElementType;
  /** Right icon slot */
  iconRight?: React.ElementType;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      icon: Icon,
      iconRight: IconRight,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {children && <span className="opacity-70">{children}</span>}
          </>
        ) : (
          <>
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            {children}
            {IconRight && <IconRight className="h-4 w-4 shrink-0" />}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
