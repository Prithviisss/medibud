import { useState, useCallback, createContext, useContext } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);

    // Start exit animation after 3.5s, then remove
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    }, 3500);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3900);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 400);
  }, []);

  const getConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return { icon: '✅', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', color: '#34d399' };
      case 'error':
        return { icon: '❌', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', color: '#f87171' };
      case 'warning':
        return { icon: '⚠️', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: '#fbbf24' };
      default:
        return { icon: 'ℹ️', bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)', color: '#a5b4fc' };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container */}
      <div style={{
        position: 'fixed', top: '20px', right: '20px', zIndex: 10000,
        display: 'flex', flexDirection: 'column', gap: '10px',
        pointerEvents: 'none', maxWidth: '380px', width: '100%',
      }}>
        {toasts.map((toast) => {
          const cfg = getConfig(toast.type);
          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 18px', borderRadius: '14px',
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                animation: toast.exiting ? 'toastOut 0.4s ease-in forwards' : 'toastIn 0.4s ease-out',
                cursor: 'pointer',
              }}
              onClick={() => dismiss(toast.id)}
            >
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{cfg.icon}</span>
              <span style={{ color: cfg.color, fontSize: '13px', fontWeight: 500, lineHeight: 1.4, flex: 1 }}>
                {toast.message}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); dismiss(toast.id); }}
                style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', fontSize: '16px', padding: '0', lineHeight: 1, flexShrink: 0,
                }}
              >×</button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(100px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0; transform: translateX(100px) scale(0.95); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
