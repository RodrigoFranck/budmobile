import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { BudConfirmDialog } from '@/components/ui/BudConfirmDialog';
import type { BudConfirmOptions } from '@/components/ui/BudConfirmDialog.types';

interface BudConfirmDialogContextValue {
  confirm: (options: BudConfirmOptions) => void;
}

const BudConfirmDialogContext = createContext<BudConfirmDialogContextValue | null>(null);

export function BudConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<BudConfirmOptions | null>(null);

  const confirm = useCallback((next: BudConfirmOptions) => {
    setOptions(next);
  }, []);

  const handleClose = useCallback(() => {
    setOptions(null);
  }, []);

  const handleCancel = useCallback(() => {
    options?.onCancel?.();
    handleClose();
  }, [handleClose, options]);

  const handleConfirm = useCallback(() => {
    const onConfirm = options?.onConfirm;
    handleClose();
    onConfirm?.();
  }, [handleClose, options]);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <BudConfirmDialogContext.Provider value={value}>
      {children}
      <BudConfirmDialog
        visible={options != null}
        title={options?.title ?? ''}
        message={options?.message ?? ''}
        cancelLabel={options?.cancelLabel}
        confirmLabel={options?.confirmLabel ?? ''}
        destructive={options?.destructive}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </BudConfirmDialogContext.Provider>
  );
}

export function useBudConfirmDialog(): BudConfirmDialogContextValue {
  const context = useContext(BudConfirmDialogContext);
  if (!context) {
    throw new Error('useBudConfirmDialog must be used within BudConfirmDialogProvider');
  }
  return context;
}
