import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import * as React from 'react';
import { cn } from '../lib/utils';

/* ─── Root ────────────────────────────────────────────────────────── */

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

/* ─── Trigger ─────────────────────────────────────────────────────── */

export interface SelectTriggerProps extends React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.Trigger
> {
  icon?: React.ElementType;
}

const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ className, children, icon: Icon, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-surface-200 bg-surface-0 px-3 py-2 text-sm transition-colors placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
      className,
    )}
    {...props}
  >
    {Icon && <Icon className="h-4 w-4 shrink-0 text-surface-400" />}
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 shrink-0 text-surface-400" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

/* ─── Scroll Up Button ────────────────────────────────────────────── */

const SelectScrollUpButton = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

/* ─── Scroll Down Button ──────────────────────────────────────────── */

const SelectScrollDownButton = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

/* ─── Content ─────────────────────────────────────────────────────── */

export interface SelectContentProps extends React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.Content
> {
  /** Whether to show a search/filter input at the top of the list */
  searchable?: boolean;
}

const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(({ className, children, position = 'popper', searchable, ...props }, ref) => {
  const [filter, setFilter] = React.useState('');
  const searchRef = React.useRef<HTMLInputElement>(null);

  const filteredChildren = React.useMemo(() => {
    if (!searchable || !filter) return children;
    const lowerFilter = filter.toLowerCase();

    return React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child;

      const childText = extractTextFromElement(child);
      if (childText && !childText.toLowerCase().includes(lowerFilter)) return null;
      return child;
    });
  }, [children, searchable, filter]);

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          'relative z-50 max-h-64 min-w-[8rem] overflow-hidden rounded-lg border border-surface-200 bg-surface-0 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className,
        )}
        position={position}
        {...props}
      >
        {searchable && (
          <div className="flex items-center border-b border-surface-200 px-2 py-1.5">
            <Search className="mr-2 h-4 w-4 shrink-0 text-surface-400" />
            <input
              ref={searchRef}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-surface-400"
            />
            {filter && (
              <button
                type="button"
                onClick={() => setFilter('')}
                className="ml-1 text-surface-400 hover:text-surface-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
          )}
        >
          {filteredChildren}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = 'SelectContent';

/* ─── Label ───────────────────────────────────────────────────────── */

const SelectLabel = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-xs font-medium text-surface-500', className)}
    {...props}
  />
));
SelectLabel.displayName = 'SelectLabel';

/* ─── Item ────────────────────────────────────────────────────────── */

const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex h-9 w-full cursor-pointer select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-surface-50 focus:text-surface-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

/* ─── Separator ───────────────────────────────────────────────────── */

const SelectSeparator = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-surface-200', className)}
    {...props}
  />
));
SelectSeparator.displayName = 'SelectSeparator';

/* ─── Multi-Select ────────────────────────────────────────────────── */

export interface MultiSelectProps {
  /** The available options */
  options: { value: string; label: string; group?: string }[];
  /** Currently selected values */
  value: string[];
  /** Called when the selection changes */
  onValueChange: (value: string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Additional class name for the trigger */
  className?: string;
  /** Max number of chips to display before showing "+N" */
  maxChips?: number;
}

function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Select...',
  disabled,
  className,
  maxChips = 3,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const grouped = React.useMemo(() => {
    const groups = new Map<string, { value: string; label: string }[]>();
    for (const opt of options) {
      const key = opt.group ?? '';
      const list = groups.get(key) ?? [];
      list.push(opt);
      groups.set(key, list);
    }
    return groups;
  }, [options]);

  const selectedLabels = React.useMemo(
    () => value.map((v) => options.find((o) => o.value === v)?.label).filter(Boolean) as string[],
    [value, options],
  );

  const toggle = (itemValue: string) => {
    onValueChange(
      value.includes(itemValue) ? value.filter((v) => v !== itemValue) : [...value, itemValue],
    );
  };

  const overflow = selectedLabels.length - maxChips;

  return (
    <SelectPrimitive.Root open={open} onOpenChange={setOpen} value="">
      <SelectTrigger className={cn(className)} disabled={disabled} aria-label={placeholder}>
        {selectedLabels.length > 0 ? (
          <span className="flex flex-wrap gap-1">
            {selectedLabels.slice(0, maxChips).map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-0.5 rounded-md bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-700"
              >
                {label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const opt = options.find((o) => o.label === label);
                    if (opt) toggle(opt.value);
                  }}
                  className="ml-0.5 hover:text-brand-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {overflow > 0 && (
              <span className="inline-flex items-center rounded-md bg-surface-100 px-1.5 py-0.5 text-xs font-medium text-surface-600">
                +{overflow}
              </span>
            )}
          </span>
        ) : (
          <span className="text-surface-400">{placeholder}</span>
        )}
      </SelectTrigger>
      <SelectContent>
        {Array.from(grouped.entries()).map(([group, items]) => (
          <SelectPrimitive.Group key={group}>
            {group && <SelectLabel>{group}</SelectLabel>}
            {items.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                onSelect={(e) => {
                  e.preventDefault();
                  toggle(opt.value);
                }}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-sm border',
                      value.includes(opt.value)
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-surface-300',
                    )}
                  >
                    {value.includes(opt.value) && <Check className="h-3 w-3" />}
                  </span>
                  {opt.label}
                </span>
              </SelectItem>
            ))}
          </SelectPrimitive.Group>
        ))}
      </SelectContent>
    </SelectPrimitive.Root>
  );
}
MultiSelect.displayName = 'MultiSelect';

/* ─── Helpers ─────────────────────────────────────────────────────── */

function extractTextFromElement(element: React.ReactElement): string {
  const props = element.props as Record<string, unknown>;
  if (typeof props?.['children'] === 'string') {
    return props['children'] as string;
  }
  if (Array.isArray(props?.['children'])) {
    return (props['children'] as React.ReactNode[])
      .map((child: React.ReactNode) =>
        typeof child === 'string'
          ? child
          : React.isValidElement(child)
            ? extractTextFromElement(child)
            : '',
      )
      .join('');
  }
  if (React.isValidElement(props?.['children'] as React.ReactNode)) {
    return extractTextFromElement(props['children'] as React.ReactElement);
  }
  return '';
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  MultiSelect,
};
