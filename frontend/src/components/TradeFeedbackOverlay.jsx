import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

export function TradeFeedbackOverlay({ status, message, onClose }) {
  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 2200);
    return () => clearTimeout(timer);
  }, [status, onClose]);

  if (!status) return null;

  const isSuccess = status === 'success';

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
      <div
        className={`pointer-events-auto max-w-sm w-full p-6 rounded-2xl border shadow-2xl backdrop-blur-xl flex flex-col items-center text-center transition-all ${
          isSuccess
            ? 'bg-emerald-950/90 border-emerald-400 text-emerald-100 shadow-emerald-500/30 animate-success-burst'
            : 'bg-rose-950/90 border-rose-500 text-rose-100 shadow-rose-500/30 animate-error-shake'
        }`}
      >
        <div className={`p-4 rounded-full mb-3 flex items-center justify-center border ${
          isSuccess
            ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400 shadow-lg shadow-emerald-500/40'
            : 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-lg shadow-rose-500/40'
        }`}>
          {isSuccess ? (
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          ) : (
            <AlertTriangle className="w-10 h-10 animate-pulse" />
          )}
        </div>

        <h3 className="text-lg font-extrabold tracking-tight font-mono uppercase">
          {isSuccess ? 'Trade Executed!' : 'Trade Blocked!'}
        </h3>

        <p className="text-xs font-semibold mt-1 opacity-90 leading-relaxed">
          {message}
        </p>

        <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-300">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Equity Arena Matching Engine</span>
        </div>
      </div>
    </div>
  );
}
