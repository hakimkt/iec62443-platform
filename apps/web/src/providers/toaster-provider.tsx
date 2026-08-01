'use client';

import { Toaster } from 'sonner';

export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 5000,
        classNames: {
          toast:
            'bg-surface-0 text-surface-900 border border-surface-200 shadow-lg',
          title: 'text-sm font-medium',
          description: 'text-sm text-surface-500',
          actionButton:
            'bg-brand-600 text-white hover:bg-brand-700 text-sm font-medium',
          cancelButton:
            'bg-surface-100 text-surface-700 hover:bg-surface-200 text-sm font-medium',
          success: 'border-green-200 bg-green-50 text-green-900',
          error: 'border-red-200 bg-red-50 text-red-900',
          warning: 'border-amber-200 bg-amber-50 text-amber-900',
          info: 'border-blue-200 bg-blue-50 text-blue-900',
        },
      }}
    />
  );
}
