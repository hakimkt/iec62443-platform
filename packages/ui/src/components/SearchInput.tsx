import * as React from 'react';
import { Search } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils.js';
import { Input } from '../primitives/Input.js';

const searchInputSizeVariants = cva('', {
  variants: {
    size: {
      sm: 'h-8',
      md: 'h-9',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface SearchInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type' | 'size' | 'prefix' | 'suffix'
  >,
    VariantProps<typeof searchInputSizeVariants> {
  /** Callback when the clear button is clicked */
  onClear?: () => void;
  /** Keyboard shortcut hint displayed when the input is empty (e.g. "⌘K") */
  shortcutHint?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      size,
      onClear,
      shortcutHint,
      value,
      disabled,
      placeholder = 'Search…',
      ...props
    },
    ref,
  ) => {
    const hasValue = value !== undefined && value !== '';
    const isSm = size === 'sm';

    return (
      <div className={cn('relative', className)}>
        <Input
          ref={ref}
          type="search"
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          className={cn(searchInputSizeVariants({ size }))}
          prefix={
            <Search
              className={cn(
                isSm ? 'h-3.5 w-3.5' : 'h-4 w-4',
              )}
              aria-hidden
            />
          }
          onClear={onClear}
          {...props}
        />
        {!hasValue && shortcutHint && !disabled && (
          <span
            className={cn(
              'absolute top-1/2 -translate-y-1/2 text-xs text-surface-400 bg-surface-100 px-1.5 py-0.5 rounded pointer-events-none',
              isSm ? 'right-2' : 'right-3',
            )}
          >
            {shortcutHint}
          </span>
        )}
      </div>
    );
  },
);
SearchInput.displayName = 'SearchInput';

export { SearchInput, searchInputSizeVariants };
