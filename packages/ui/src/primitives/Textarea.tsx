import * as React from 'react';
import { cn } from '../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Whether the textarea is in an error state */
  error?: boolean;
  /** Error message displayed below the textarea */
  errorText?: string;
  /** Maximum character count. When set, displays a counter below the textarea. */
  maxLength?: number;
  /** Whether to auto-resize the textarea based on content */
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      error,
      errorText,
      maxLength,
      autoResize = false,
      disabled,
      value,
      onChange,
      ...props
    },
    ref,
  ) => {
    const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }
      },
      [ref],
    );

    const handleResize = React.useCallback(() => {
      const textarea = internalRef.current;
      if (!textarea || !autoResize) return;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }, [autoResize]);

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        handleResize();
        onChange?.(e);
      },
      [handleResize, onChange],
    );

    React.useEffect(() => {
      handleResize();
    }, [handleResize, value]);

    const charCount = typeof value === 'string' ? value.length : 0;
    const isOverLimit = maxLength !== undefined && charCount > maxLength;

    return (
      <div className="w-full">
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-surface-200 bg-surface-0 px-3 py-2 text-sm transition-colors placeholder:text-surface-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-surface-500',
            error && 'border-red-500 focus-visible:ring-red-500',
            className,
          )}
          ref={setRefs}
          disabled={disabled}
          value={value}
          onChange={handleChange}
          aria-invalid={error || undefined}
          aria-describedby={
            errorText ? `${props.id}-error` : maxLength ? `${props.id}-count` : undefined
          }
          {...props}
        />
        <div className="mt-1 flex justify-between">
          {errorText ? (
            <p id={`${props.id}-error`} className="text-sm text-red-600" role="alert">
              {errorText}
            </p>
          ) : (
            <span />
          )}
          {maxLength !== undefined && (
            <p
              id={`${props.id}-count`}
              className={cn('text-xs text-surface-400', isOverLimit && 'text-red-600')}
            >
              {charCount} / {maxLength}
            </p>
          )}
        </div>
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
