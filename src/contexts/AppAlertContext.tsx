import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { AppAlert } from '@/components/ui/AppAlert';
import type { AppAlertOptions, AppAlertState } from '@/components/ui/AppAlert.types';

type ShowAppAlert = (options: AppAlertOptions) => void;

interface AppAlertContextType {
  showAlert: ShowAppAlert;
}

const AppAlertContext = createContext<AppAlertContextType | undefined>(undefined);

let globalShowAlert: ShowAppAlert | null = null;

export function appAlert(options: AppAlertOptions): void {
  globalShowAlert?.(options);
}

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AppAlertState | null>(null);
  const alertIdRef = useRef(0);

  const showAlert = useCallback<ShowAppAlert>((options) => {
    alertIdRef.current += 1;
    setAlert({ ...options, id: alertIdRef.current });
  }, []);

  const dismissAlert = useCallback(() => {
    setAlert(null);
  }, []);

  useEffect(() => {
    globalShowAlert = showAlert;
    return () => {
      globalShowAlert = null;
    };
  }, [showAlert]);

  const value = useMemo(() => ({ showAlert }), [showAlert]);

  return (
    <AppAlertContext.Provider value={value}>
      {children}
      <AppAlert alert={alert} onDismiss={dismissAlert} />
    </AppAlertContext.Provider>
  );
}

export function useAppAlert(): AppAlertContextType {
  const context = useContext(AppAlertContext);
  if (!context) {
    throw new Error('useAppAlert must be used within an AppAlertProvider');
  }
  return context;
}
