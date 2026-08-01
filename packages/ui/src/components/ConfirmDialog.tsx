import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../primitives/Dialog.js';
import { Button } from '../primitives/Button.js';

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Descriptive text below the title */
  description?: string;
  /** Label for the confirm button; defaults based on variant */
  confirmLabel?: string;
  /** Label for the cancel button */
  cancelLabel?: string;
  /** Visual variant controlling the confirm button style */
  variant?: 'danger' | 'warning' | 'info';
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** Whether the confirm action is in progress */
  loading?: boolean;
}

const variantDefaults: Record<
  'danger' | 'warning' | 'info',
  { confirmLabel: string; buttonVariant: 'danger' | 'primary' }
> = {
  danger: { confirmLabel: 'Delete', buttonVariant: 'danger' },
  warning: { confirmLabel: 'Continue', buttonVariant: 'primary' },
  info: { confirmLabel: 'Confirm', buttonVariant: 'primary' },
};

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel: confirmLabelProp,
  cancelLabel = 'Cancel',
  variant = 'info',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const defaults = variantDefaults[variant] ?? variantDefaults['info'];
  const confirmLabel = confirmLabelProp ?? defaults['confirmLabel'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-surface-500 mt-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={defaults['buttonVariant']}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
ConfirmDialog.displayName = 'ConfirmDialog';

export { ConfirmDialog };
