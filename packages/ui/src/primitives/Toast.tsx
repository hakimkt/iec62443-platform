import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

/* ───────────────────────────── Position variants ──────────────── */

const viewportPositionMap = {
  'top-right': 'top-0 right-0 flex-col',
  'top-left': 'top-0 left-0 flex-col',
  'bottom-right': 'bottom-0 right-0 flex-col-reverse',
  'bottom-left': 'bottom-0 left-0 flex-col-reverse',
  'top-center': 'top-0 left-1/2 -translate-x-1/2 flex-col',
  'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2 flex-col-reverse',
} as const;

/* ───────────────────────────── Toast variants ─────────────────── */

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-3 overflow-hidden rounded-lg border p-4 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-slide-in-right data-[state=closed]:animate-fade-in',
  {
    variants: {
      variant: {
        success:
          'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
        error:
          'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
        warning:
          'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
        info:
          'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
        default:
          'border-surface-200 bg-white text-surface-900 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

/* ───────────────────────────── Provider ───────────────────────── */

const ToastProvider = ToastPrimitive.Provider;

/* ───────────────────────────── Viewport ───────────────────────── */

interface ToastViewportProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport> {
  position?: keyof typeof viewportPositionMap;
}

const ToastViewport = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Viewport>,
  ToastViewportProps
>(({ className, position = 'bottom-right', ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed z-toast flex max-h-screen w-full max-w-[420px] p-4 outline-none',
      viewportPositionMap[position],
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

/* ───────────────────────────── Root ───────────────────────────── */

interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>,
    VariantProps<typeof toastVariants> {}

const Toast = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Root>,
  ToastProps
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
));
Toast.displayName = ToastPrimitive.Root.displayName;

/* ───────────────────────────── Title ──────────────────────────── */

const ToastTitle = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

/* ───────────────────────────── Description ────────────────────── */

const ToastDescription = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn('text-sm opacity-90', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

/* ───────────────────────────── Action ─────────────────────────── */

const ToastAction = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-surface-200 bg-transparent px-3 text-sm font-medium transition-colors hover:bg-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-surface-700 dark:hover:bg-surface-800 dark:focus:ring-offset-surface-900',
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitive.Action.displayName;

/* ───────────────────────────── Close ──────────────────────────── */

const ToastClose = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      'absolute right-1 top-1 rounded-md p-1 text-surface-500 opacity-0 transition-opacity hover:text-surface-900 focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100 group-focus-within:opacity-100 dark:text-surface-400 dark:hover:text-surface-100',
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

/* ───────────────────────────── Hook ───────────────────────────── */

function useToast() {
  const [toasts, setToasts] = React.useState<
    Array<{
      id: string;
      title?: string;
      description?: string;
      variant?: VariantProps<typeof toastVariants>['variant'];
      action?: React.ReactNode;
      duration?: number;
    }>
  >([]);

  const addToast = React.useCallback(
    (toast: Omit<(typeof toasts)[number], 'id'>) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { ...toast, id }]);
      return id;
    },
    [],
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

/* ────────────────────────── Exports ───────────────────────────── */

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  toastVariants,
  useToast,
};

export type {
  ToastProps,
  ToastViewportProps,
};
