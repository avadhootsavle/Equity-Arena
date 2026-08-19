import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Pencil, RefreshCw, AlertTriangle } from 'lucide-react';

const fmt = (n, d = 2) =>
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  });

/**
 * Edit a waiting order's price and share count.
 *
 * Only the fields a player can meaningfully change are editable — the stock
 * and the buy/sell direction stay fixed, because changing those is really a
 * different order.
 */
export function EditOrderDialog({ open, order, livePrice, onSave, onCancel }) {
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !order) return;
    setPrice(String(order.targetPrice ?? ''));
    setQty(String(order.quantity ?? ''));
    setError('');
    setSaving(false);
  }, [open, order?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !saving) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, saving, onCancel]);

  const parsedPrice = parseFloat(price);
  const parsedQty = parseInt(qty, 10);

  const spot = livePrice ?? order?.stock?.currentPrice ?? 0;
  const isBuy = order?.type === 'BUY';

  const problem = useMemo(() => {
    if (!(parsedPrice > 0)) return 'Enter a price above 0.';
    if (!(parsedQty > 0)) return 'Enter at least 1 share.';
    return '';
  }, [parsedPrice, parsedQty]);

  if (!open || !order) return null;

  const total = (parsedPrice > 0 && parsedQty > 0 ? parsedPrice * parsedQty : 0);
  const unchanged =
    parsedPrice === order.targetPrice && parsedQty === order.quantity;

  // Explain in plain words what will happen with the entered price
  const outcome = isBuy
    ? parsedPrice >= spot
      ? 'This price is at or above the current price, so it will buy straight away.'
      : `Waits until ${order.stock?.symbol || 'the stock'} drops to ${fmt(parsedPrice)} IC.`
    : parsedPrice <= spot
    ? 'This price is at or below the current price, so it will sell straight away.'
    : `Waits until ${order.stock?.symbol || 'the stock'} rises to ${fmt(parsedPrice)} IC.`;

  const submit = async (e) => {
    e.preventDefault();
    if (problem || saving) return;
    setSaving(true);
    setError('');
    const result = await onSave(order.id, {
      targetPrice: parsedPrice,
      quantity: parsedQty
    });
    setSaving(false);
    if (result?.error) setError(result.error);
  };

  const accent = isBuy ? 'var(--gain-green)' : 'var(--loss-red)';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--scrim)', backdropFilter: 'blur(3px)' }}
      onClick={() => !saving && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-order-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm surface overflow-hidden"
        style={{ boxShadow: 'var(--card-shadow)' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b theme-border">
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                color: 'var(--accent)'
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </span>
            <div>
              <h3
                id="edit-order-title"
                className="text-[13px] font-heading font-bold theme-text-main"
              >
                Change this order
              </h3>
              <p className="text-[10.5px] theme-text-muted">
                {isBuy ? 'Will buy' : 'Will sell'} {order.stock?.name || order.stock?.symbol}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            aria-label="Close"
            className="p-1.5 rounded theme-text-dim hover:theme-text-main transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-4 space-y-3.5">
          <div className="surface-panel px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] theme-text-muted">Price right now</span>
            <span className="text-[12.5px] font-mono font-bold theme-text-main">
              {fmt(spot)} IC
            </span>
          </div>

          <div>
            <label
              htmlFor="edit-price"
              className="block text-[11px] font-medium theme-text-muted mb-1.5"
            >
              Buy/sell it when the price reaches
            </label>
            <div className="flex items-center gap-2">
              <input
                id="edit-price"
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="flex-1 h-[38px] rounded-md border theme-border theme-bg-input px-3 text-[14px] font-mono font-bold theme-text-main focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setPrice(spot.toFixed(2))}
                className="px-2.5 h-[38px] rounded-md border theme-border text-[11px] font-medium theme-text-muted hover:theme-text-main transition-colors whitespace-nowrap"
              >
                Use {fmt(spot)}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-qty"
              className="block text-[11px] font-medium theme-text-muted mb-1.5"
            >
              How many shares
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQty((q) => String(Math.max(1, (parseInt(q, 10) || 1) - 1)))}
                aria-label="One less share"
                className="w-10 h-[38px] rounded-md border theme-border theme-bg-input theme-text-main font-bold hover:theme-bg-card-hover transition-colors"
              >
                −
              </button>
              <input
                id="edit-qty"
                type="number"
                min="1"
                step="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="flex-1 h-[38px] rounded-md border theme-border theme-bg-input px-3 text-center text-[14px] font-mono font-bold theme-text-main focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQty((q) => String((parseInt(q, 10) || 0) + 1))}
                aria-label="One more share"
                className="w-10 h-[38px] rounded-md border theme-border theme-bg-input theme-text-main font-bold hover:theme-bg-card-hover transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div className="surface-panel px-3 py-2.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] theme-text-muted">
                {isBuy ? 'Cash it will use' : 'Cash you will get'}
              </span>
              <span
                className="text-[14px] font-mono font-extrabold"
                style={{ color: accent }}
              >
                {fmt(total)} IC
              </span>
            </div>
            <p className="text-[10.5px] theme-text-muted leading-snug">{outcome}</p>
          </div>

          {(problem || error) && (
            <div
              className="flex items-start gap-2 p-2.5 rounded-md text-[11px] leading-snug"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--loss-red) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--loss-red) 34%, transparent)',
                color: 'var(--loss-red)'
              }}
            >
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
              <span>{error || problem}</span>
            </div>
          )}

          <div className="flex gap-2 pt-0.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="flex-1 h-[38px] rounded-md text-[12px] font-semibold surface-panel theme-text-muted hover:theme-text-main transition-colors disabled:opacity-40"
            >
              Keep as it is
            </button>
            <button
              type="submit"
              disabled={!!problem || saving || unchanged}
              className="flex-1 h-[38px] rounded-md text-[12px] font-heading font-bold text-white flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save changes'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
