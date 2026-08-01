import * as React from 'react';
import { UploadCloud } from 'lucide-react';
import { cn } from '../lib/utils.js';

/* ───────────────────────────── Props ──────────────────────────── */

export interface FileUploadProps
  extends React.HTMLAttributes<HTMLDivElement> {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  disabled?: boolean;
}

/* ───────────────────────────── Helpers ────────────────────────── */

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/* ───────────────────────────── Component ──────────────────────── */

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      className,
      onFilesSelected,
      accept,
      multiple = false,
      maxSize,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isDragActive, setIsDragActive] = React.useState(false);

    const dragCounter = React.useRef(0);

    const handleDragEnter = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        dragCounter.current += 1;
        if (dragCounter.current === 1) {
          setIsDragActive(true);
        }
      },
      [disabled],
    );

    const handleDragLeave = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        dragCounter.current -= 1;
        if (dragCounter.current === 0) {
          setIsDragActive(false);
        }
      },
      [disabled],
    );

    const handleDragOver = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
      },
      [],
    );

    const processFiles = React.useCallback(
      (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;

        let files = Array.from(fileList);

        if (maxSize) {
          files = files.filter((f) => f.size <= maxSize);
        }

        if (!multiple) {
          files = files.slice(0, 1);
        }

        if (files.length > 0) {
          onFilesSelected(files);
        }
      },
      [maxSize, multiple, onFilesSelected],
    );

    const handleDrop = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        dragCounter.current = 0;
        setIsDragActive(false);
        processFiles(e.dataTransfer.files);
      },
      [disabled, processFiles],
    );

    const handleClick = React.useCallback(() => {
      if (disabled) return;
      inputRef.current?.click();
    }, [disabled]);

    const handleInputChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(e.target.files);
        // Reset the input so the same file can be re-selected
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      },
      [processFiles],
    );

    // Build subtext
    const subtextParts: string[] = [];
    if (accept) {
      subtextParts.push(`Accepts: ${accept}`);
    }
    if (maxSize) {
      subtextParts.push(`Max size: ${formatBytes(maxSize)}`);
    }
    const subtext = subtextParts.join(' · ');

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={disabled ? -1 : 0}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragActive
            ? 'border-brand-500 bg-brand-50'
            : 'border-surface-300',
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:border-brand-400 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          className,
        )}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        aria-disabled={disabled}
        {...props}
      >
        <UploadCloud
          className={cn(
            'mx-auto h-10 w-10 mb-3',
            isDragActive ? 'text-brand-500' : 'text-surface-400',
          )}
          aria-hidden
        />
        <p className="text-sm text-surface-700">
          Drop files here or click to browse
        </p>
        {subtext && (
          <p className="text-xs text-surface-400 mt-1">{subtext}</p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          tabIndex={-1}
          aria-hidden
        />
      </div>
    );
  },
);
FileUpload.displayName = 'FileUpload';

export { FileUpload };
