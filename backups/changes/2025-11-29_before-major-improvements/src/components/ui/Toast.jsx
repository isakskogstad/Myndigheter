import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, Check, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-fade-in-up min-w-[300px]
              ${toast.type === 'success' ? 'bg-white border-emerald-100 text-slate-800' : ''}
              ${toast.type === 'error' ? 'bg-white border-red-100 text-slate-800' : ''}
              ${toast.type === 'info' ? 'bg-slate-900 border-slate-800 text-white' : ''}
            `}
          >
            {toast.type === 'success' && <div className="bg-emerald-100 p-1 rounded-full"><Check className="w-4 h-4 text-emerald-600" /></div>}
            {toast.type === 'error' && <div className="bg-red-100 p-1 rounded-full"><AlertCircle className="w-4 h-4 text-red-600" /></div>}
            {toast.type === 'info' && <div className="bg-slate-800 p-1 rounded-full"><Info className="w-4 h-4 text-slate-400" /></div>}
            
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            
            <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
