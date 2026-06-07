'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type Toast = { id: number; message: string; type: 'success' | 'error' };

type ToastContextValue = {
  showToast: (message: string, type?: Toast['type']) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[100] flex flex-col gap-2 sm:left-auto sm:w-96 lg:bottom-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'rounded-xl border px-4 py-3 text-sm shadow-glow backdrop-blur',
              toast.type === 'success' ? 'border-green-500/40 bg-green-500/15 text-green-100' : 'border-red-500/40 bg-red-500/15 text-red-100'
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
