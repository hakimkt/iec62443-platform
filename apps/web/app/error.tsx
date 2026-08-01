'use client';

import { Button } from '@iec62443/ui/primitives';

export default function Error({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void _error;
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-red-600"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-surface-900">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-surface-500">
          An unexpected error occurred. Please try again.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={() => window.history.back()}>
            Go back
          </Button>
          <Button variant="primary" onClick={reset}>
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
