import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import * as React from 'react';
import { cn } from '../lib/utils';

/* ───────────────────────────── Width variants ─────────────────── */

const contextPanelWidthVariants = cva('', {
  variants: {
    width: {
      sm: 'w-96',
      md: 'w-[420px]',
      lg: 'w-[512px]',
    },
  },
  defaultVariants: {
    width: 'md',
  },
});

/* ───────────────────────────── Props ──────────────────────────── */

export interface ContextPanelProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof contextPanelWidthVariants> {
  open: boolean;
  onClose: () => void;
  title?: string;
}

/* ───────────────────────────── Component ──────────────────────── */

const ContextPanel = React.forwardRef<HTMLDivElement, ContextPanelProps>(
  ({ className, open, onClose, title, width, children, ...props }, ref) => {
    // Close on Escape
    React.useEffect(() => {
      if (!open) return;

      function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
          onClose();
        }
      }

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    // Prevent body scroll when open
    React.useEffect(() => {
      if (open) {
        const original = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = original;
        };
      }
    }, [open]);

    return (
      <>
        {/* Overlay */}
        <div
          className={cn(
            'fixed inset-0 z-50 bg-black/50 transition-opacity duration-200',
            open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          )}
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Panel */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={cn(
            'fixed right-0 top-0 z-50 h-full bg-surface-0 shadow-panel border-l border-surface-200 flex flex-col transition-transform duration-200',
            contextPanelWidthVariants({ width }),
            open ? 'translate-x-0' : 'translate-x-full',
            className,
          )}
          {...props}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
            {title ? <h2 className="text-lg font-semibold text-surface-900">{title}</h2> : <span />}
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors',
                !title && 'ml-auto',
              )}
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </>
    );
  },
);
ContextPanel.displayName = 'ContextPanel';

export { ContextPanel, contextPanelWidthVariants };
