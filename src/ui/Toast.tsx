import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from './Button';

type ToastAction = { label: string; onClick: () => void };
type ToastState = { id: number; message: string; action?: ToastAction } | null;
type ToastApi = { show: (message: string, action?: ToastAction) => void };

const Ctx = createContext<ToastApi>({ show: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const counter = useRef(0);
  const show = useCallback((message: string, action?: ToastAction) => {
    counter.current += 1;
    setToast({ id: counter.current, message, action });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast((cur) => (cur?.id === toast.id ? null : cur)), toast.action ? 5000 : 2500);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div role="status" aria-live="polite">
        {toast && (
          <div className="toast" key={toast.id}>
            <span className="toast__text t-subhead">{toast.message}</span>
            {toast.action && (
              <Button variant="tinted" onClick={() => { toast.action!.onClick(); setToast(null); }}>
                {toast.action.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  return useContext(Ctx);
}
