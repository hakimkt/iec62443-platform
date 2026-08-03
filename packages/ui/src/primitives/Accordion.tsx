import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { cn } from '../lib/utils';

/* ───────────────────────────── Root ───────────────────────────── */

const accordionVariants = cva('divide-y divide-surface-200 dark:divide-surface-700', {
  variants: {
    variant: {
      bordered: 'rounded-lg border border-surface-200 dark:border-surface-700 divide-y-0',
      separated: 'space-y-2',
      simple: '',
    },
  },
  defaultVariants: {
    variant: 'simple',
  },
});

interface AccordionProps extends VariantProps<typeof accordionVariants> {
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  dir?: 'ltr' | 'rtl';
  className?: string;
  children?: React.ReactNode;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ className, variant, type = 'single', collapsible = true, ...props }, ref) => (
    <AccordionPrimitive.Root
      ref={ref}
      type={type as 'single'}
      collapsible={collapsible}
      className={cn(accordionVariants({ variant }), className)}
      {...props}
    />
  ),
);
Accordion.displayName = 'Accordion';

/* ───────────────────────────── Item ───────────────────────────── */

const accordionItemVariants = cva('', {
  variants: {
    variant: {
      bordered: 'px-4 first:rounded-t-lg last:rounded-b-lg',
      separated: 'rounded-lg border border-surface-200 dark:border-surface-700 px-4',
      simple: '',
    },
  },
  defaultVariants: {
    variant: 'simple',
  },
});

interface AccordionItemProps
  extends
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>,
    VariantProps<typeof accordionItemVariants> {}

const AccordionItem = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, variant, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(accordionItemVariants({ variant }), className)}
    {...props}
  />
));
AccordionItem.displayName = 'AccordionItem';

/* ───────────────────────────── Trigger ────────────────────────── */

const accordionTriggerVariants = cva(
  'flex flex-1 items-center justify-between py-4 text-sm font-medium text-surface-900 dark:text-surface-100 transition-all hover:text-surface-700 dark:hover:text-surface-300 [&[data-state=open]>svg]:rotate-180',
  {
    variants: {
      variant: {
        bordered: '',
        separated: '',
        simple: 'py-3',
      },
    },
    defaultVariants: {
      variant: 'simple',
    },
  },
);

interface AccordionTriggerProps
  extends
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>,
    VariantProps<typeof accordionTriggerVariants> {}

const AccordionTrigger = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(({ className, variant, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(accordionTriggerVariants({ variant }), className)}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-surface-500 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = 'AccordionTrigger';

/* ───────────────────────────── Content ────────────────────────── */

const AccordionContent = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn('pb-4 pt-0', className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = 'AccordionContent';

/* ────────────────────────── Exports ───────────────────────────── */

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  accordionVariants,
  accordionItemVariants,
  accordionTriggerVariants,
};

export type { AccordionProps, AccordionItemProps, AccordionTriggerProps };
