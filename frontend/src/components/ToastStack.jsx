import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const TONES = {
  success: { color: 'var(--gain-green)', Icon: CheckCircle2 },
  error: { color: 'var(--loss-red)', Icon: AlertCircle },
  info: { color: 'var(--accent)', Icon: Info }
};

function Toast({ toast, onDismiss }) {
  const { color, Icon } = TONES[toast.type] || TONES.info;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 4200);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-slide-in-right flex items-start gap-2.5 w-[300px] max-w-[calc(100vw-2rem)] px-3 py-2.5 rounded-lg border theme-bg-elevated"
      style={{
        borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
        boxShadow: 'var(--card-shadow)'
      }}
    >
      <Icon className="w-4 h-4 flex-shrink-0 mt-px" style={{ color }} />

      <div className="flex-1 min-w-0">
        {toast.title && (
          <div
            className="text-[11px] font-heading font-bold uppercase tracking-wide"
            style={{ color }}
          >
            {toast.title}
          </div>
        )}
        <p className="text-[11px] theme-text-main font-mono leading-snug break-words">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="p-0.5 rounded theme-text-dim hover:theme-text-main transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastStack({ toasts = [], onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-[66px] right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
