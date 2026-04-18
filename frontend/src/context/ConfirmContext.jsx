import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, title: '', message: '', confirmLabel: 'Confirm', cancelLabel: 'Cancel', danger: false });
  const resolveRef = useRef(null);

  const confirm = useCallback(({ title = 'Confirm', message = 'Are you sure?', confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = true } = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ open: true, title, message, confirmLabel, cancelLabel, danger });
    });
  }, []);

  const handleConfirm = () => {
    setState(s => ({ ...s, open: false }));
    resolveRef.current?.(true);
  };

  const handleCancel = () => {
    setState(s => ({ ...s, open: false }));
    resolveRef.current?.(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancel} />
          {/* Dialog */}
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 fade-in duration-200">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${state.danger ? 'bg-red-100 dark:bg-red-500/15' : 'bg-indigo-100 dark:bg-indigo-500/15'}`}>
                  <AlertTriangle className={`w-5 h-5 ${state.danger ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold text-heading">{state.title}</h3>
                  <p className="text-[13px] text-sub mt-1 leading-relaxed">{state.message}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={handleCancel} className="flex-1 py-2.5 border border-border rounded-xl text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">
                {state.cancelLabel}
              </button>
              <button onClick={handleConfirm} className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium text-white transition-colors ${state.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
