import { Check, Copy } from 'lucide-react';
import * as React from 'react';
import { cn } from '../lib/utils';
import { Button } from '../primitives/Button';

/* ───────────────────────────── Types ──────────────────────────── */

export interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  successLabel?: string;
  label?: string;
}

/* ──────────────────────────── Component ───────────────────────── */

const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  ({ className, value, successLabel = 'Copied!', label = 'Copy', onClick, ...props }, ref) => {
    const [copied, setCopied] = React.useState(false);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    const handleCopy = React.useCallback(
      async (e: React.MouseEvent<HTMLButtonElement>) => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          // Fallback for environments without clipboard API
          const textarea = document.createElement('textarea');
          textarea.value = value;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }

        setCopied(true);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, 2000);

        onClick?.(e);
      },
      [value, onClick],
    );

    return (
      <Button
        ref={ref}
        variant="ghost"
        size="sm"
        className={cn(className)}
        onClick={handleCopy}
        icon={copied ? Check : Copy}
        {...(copied ? { 'data-copied': true } : {})}
        {...props}
      >
        {copied ? <span className="text-green-600">{successLabel}</span> : label}
      </Button>
    );
  },
);
CopyButton.displayName = 'CopyButton';

export { CopyButton };
