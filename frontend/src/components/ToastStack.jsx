import React, { useEffect } from 'react';
import { X } from 'lucide-react';

function Toast({ toast, onDismiss }) {
  const duration = toast.duration ?? 2500;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  const borderLeftClass =
    toast.type === 'error' || toast.type === 'failure'
      ? 'border-l-4 border-l-[#F85149]'
      : toast.type === 'warning'
      ? 'border-l-4 border-l-[#F0B429]'
      : 'border-l-4 border-l-[#3FB950]';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-between gap-3 w-[320px] max-w-[calc(100vw-2rem)] px-3.5 py-2.5 rounded-[4px] bg-[#111111] border border-[#2A2A2A] ${borderLeftClass} text-xs font-mono text-white shadow-xl animate-fadeIn`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white leading-snug break-words">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="p-0.5 text-[#888888] hover:text-white transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastStack({ toasts = [], onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
