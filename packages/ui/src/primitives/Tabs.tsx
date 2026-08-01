import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils.js';

/* ───────────────────────────── Root ───────────────────────────── */

const tabsRootVariants = cva('flex', {
  variants: {
    layout: {
      horizontal: 'flex-col',
      vertical: 'flex-row',
    },
  },
  defaultVariants: {
    layout: 'horizontal',
  },
});

interface TabsProps
  extends Omit<React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>, 'orientation'>,
    VariantProps<typeof tabsRootVariants> {
  /** Orientation of the tabs — maps to both Radix and visual layout */
  orientation?: 'horizontal' | 'vertical';
}

const Tabs = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ className, layout, orientation, ...props }, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    orientation={orientation}
    className={cn(tabsRootVariants({ layout: layout ?? orientation }), className)}
    {...props}
  />
));
Tabs.displayName = 'Tabs';

/* ───────────────────────────── List ───────────────────────────── */

const tabsListVariants = cva('inline-flex items-center shrink-0', {
  variants: {
    variant: {
      underline:
        'border-b border-surface-200 dark:border-surface-700 gap-1',
      pill:
        'bg-surface-100 dark:bg-surface-800 rounded-lg p-1 gap-0.5',
    },
    layout: {
      horizontal:
        'flex-row h-10',
      vertical:
        'flex-col border-r border-surface-200 dark:border-surface-700 w-48',
    },
  },
  defaultVariants: {
    variant: 'underline',
    layout: 'horizontal',
  },
});

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, layout, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant, layout }), className)}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

/* ───────────────────────────── Trigger ────────────────────────── */

const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        underline: [
          'border-b-2 border-transparent px-4 pb-2 pt-1 -mb-px',
          'text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-100',
          'data-[state=active]:border-brand-600 data-[state=active]:text-brand-700',
          'dark:data-[state=active]:border-brand-400 dark:data-[state=active]:text-brand-300',
        ],
        pill: [
          'rounded-md px-3 py-1.5',
          'text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-100',
          'data-[state=active]:bg-white data-[state=active]:text-brand-700 data-[state=active]:shadow-sm',
          'dark:data-[state=active]:bg-surface-700 dark:data-[state=active]:text-brand-300',
        ],
      },
      layout: {
        horizontal: '',
        vertical: [
          'justify-start border-b-0 border-r-2 border-transparent px-3 py-2 -mr-px',
          'data-[state=active]:border-brand-600 dark:data-[state=active]:border-brand-400',
        ],
      },
    },
    defaultVariants: {
      variant: 'underline',
      layout: 'horizontal',
    },
  },
);

interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {}

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, layout, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant, layout }), className)}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

/* ───────────────────────────── Content ────────────────────────── */

const tabsContentVariants = cva(
  'mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
  {
    variants: {
      layout: {
        horizontal: '',
        vertical: 'ml-4 mt-0',
      },
    },
    defaultVariants: {
      layout: 'horizontal',
    },
  },
);

interface TabsContentProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>,
    VariantProps<typeof tabsContentVariants> {}

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, layout, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(tabsContentVariants({ layout }), className)}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';

/* ────────────────────────── Exports ───────────────────────────── */

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsRootVariants,
  tabsListVariants,
  tabsTriggerVariants,
  tabsContentVariants,
};

export type {
  TabsProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
};
