import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils.js';

/* ───────────────────────────── Size variants ──────────────────── */

const avatarVariants = cva(
  'relative inline-flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const avatarFallbackVariants = cva(
  'flex h-full w-full items-center justify-center rounded-full bg-surface-200 dark:bg-surface-700 font-medium text-surface-600 dark:text-surface-300',
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const avatarImageVariants = cva('aspect-square h-full w-full object-cover', {
  variants: {
    size: {
      sm: '',
      md: '',
      lg: '',
      xl: '',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

/* ───────────────────────────── Status indicator ───────────────── */

const statusDotVariants = cva(
  'absolute rounded-full border-2 border-white dark:border-surface-900',
  {
    variants: {
      status: {
        online: 'bg-green-500',
        offline: 'bg-surface-400',
        busy: 'bg-red-500',
        away: 'bg-amber-500',
        dnd: 'bg-red-500',
      },
      size: {
        sm: 'h-2.5 w-2.5 bottom-0 right-0',
        md: 'h-3 w-3 bottom-0 right-0',
        lg: 'h-3.5 w-3.5 bottom-0.5 right-0.5',
        xl: 'h-4 w-4 bottom-0.5 right-0.5',
      },
    },
    defaultVariants: {
      status: 'online',
      size: 'md',
    },
  },
);

/* ───────────────────────────── Avatar Root ────────────────────── */

interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  status?: VariantProps<typeof statusDotVariants>['status'];
}

const Avatar = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size, status, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(avatarVariants({ size }), className)}
    {...props}
  >
    {props.children}
    {status && <span className={cn(statusDotVariants({ status, size }))} />}
  </AvatarPrimitive.Root>
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

/* ───────────────────────────── Avatar Image ───────────────────── */

interface AvatarImageProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>,
    VariantProps<typeof avatarImageVariants> {}

const AvatarImage = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, size, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn(avatarImageVariants({ size }), className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

/* ───────────────────────────── Avatar Fallback ────────────────── */

interface AvatarFallbackProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>,
    VariantProps<typeof avatarFallbackVariants> {}

const AvatarFallback = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, size, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(avatarFallbackVariants({ size }), className)}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

/* ───────────────────────────── Helpers ────────────────────────── */

/**
 * Generate initials from a name string.
 * "John Doe" → "JD", "Jane" → "J"
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/* ────────────────────────── Exports ───────────────────────────── */

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  avatarVariants,
  avatarFallbackVariants,
  statusDotVariants,
  getInitials,
};

export type {
  AvatarProps,
  AvatarImageProps,
  AvatarFallbackProps,
};
