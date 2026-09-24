/* eslint-disable */
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextProps {
  toast: (options: Omit<ToastMessage, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case 'success': return <CheckCircle2 className="text-success" size={20} aria-hidden="true" />;
    case 'error': return <AlertCircle className="text-danger" size={20} aria-hidden="true" />;
    case 'warning': return <AlertTriangle className="text-warning" size={20} aria-hidden="true" />;
    case 'info': return <Info className="text-accent" size={20} aria-hidden="true" />;
  }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timeoutsRef = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const shouldReduceMotion = useReducedMotion();

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }
  }, []);

  const toast = useCallback((options: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...options, id }]);
    
    if (options.duration !== Infinity) {
      timeoutsRef.current[id] = setTimeout(() => {
        removeToast(id);
      }, options.duration || 4000);
    }
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => toast({ type: 'success', message, title }), [toast]);
  const error = useCallback((message: string, title?: string) => toast({ type: 'error', message, title, duration: 6000 }), [toast]);
  const warning = useCallback((message: string, title?: string) => toast({ type: 'warning', message, title, duration: 5000 }), [toast]);
  const info = useCallback((message: string, title?: string) => toast({ type: 'info', message, title }), [toast]);

  useEffect(() => {
    const currentTimeouts = timeoutsRef.current;
    return () => {
      Object.values(currentTimeouts).forEach(clearTimeout);
    };
  }, []);

  const contextValue = useMemo(
    () => ({ toast, success, error, warning, info }),
    [toast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast Container */}
      <div 
        className="fixed bottom-0 right-0 p-4 sm:p-6 z-[100] flex flex-col gap-3 pointer-events-none w-full sm:w-auto sm:max-w-md"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              role={t.type === 'error' ? 'alert' : 'status'}
              aria-live={t.type === 'error' ? 'assertive' : 'polite'}
              layout={!shouldReduceMotion}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 50, scale: shouldReduceMotion ? 1 : 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md relative overflow-hidden
                ${t.type === 'error' ? 'border-danger/30 bg-danger-bg shadow-danger/10 text-danger' : ''}
                ${t.type === 'success' ? 'border-success/30 bg-success-bg shadow-success/10 text-success' : ''}
                ${t.type === 'warning' ? 'border-warning/30 bg-warning-bg shadow-warning/10 text-warning' : ''}
                ${t.type === 'info' ? 'border-accent/30 bg-surface shadow-accent/10' : ''}
              `}
            >
              <div className="shrink-0 mt-0.5">
                <ToastIcon type={t.type} />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                {t.title && <h4 className="text-sm font-bold text-foreground mb-0.5">{t.title}</h4>}
                <p className="text-sm text-text-secondary leading-snug break-words">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="absolute top-3 right-3 text-text-muted hover:text-foreground transition-colors p-1 min-w-[24px] min-h-[24px] flex items-center justify-center"
                aria-label="Cerrar notificación"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) return { toast: () => {}, success: () => {}, error: () => {}, warning: () => {}, info: () => {} } as any;
  return context;
};
