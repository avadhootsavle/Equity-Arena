import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { X, ArrowUpRight, ArrowDownRight, ShoppingBag, AlertTriangle } from 'lucide-react';

export function TradeModal({ stock, userWallet, userHolding, isOpen, onClose, onSuccess }) {
  const [mode, setMode] = useState('BUY');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setQuantity(1);
    setError('');
  }, [stock, mode, isOpen]);

  if (!isOpen || !stock) return null;

  const currentPrice = stock.currentPrice;
  const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
  const totalAmount = Math.round(parsedQty * currentPrice * 100) / 100;

  const ownedQty = userHolding ? userHolding.quantity : 0;
  const canBuy = userWallet >= totalAmount;
  const canSell = ownedQty >= parsedQty;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'BUY' ? '/trade/buy' : '/trade/sell';
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          stockId: stock.id,
          quantity: parsedQty
        })
      });

      if (onSuccess) {
        const msg = mode === 'BUY' 
          ? `Done! You bought ${parsedQty} shares of ${stock.symbol}.`
          : `Done! You sold ${parsedQty} shares of ${stock.symbol}.`;
        onSuccess(msg, data.portfolio);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Trade failed — please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 theme-bg-main/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md theme-bg-card p-6 rounded-2xl border theme-border shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 theme-bg-panel hover:theme-bg-card-hover theme-text-muted hover:theme-text-main rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold theme-text-main font-mono">{stock.symbol}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold theme-bg-panel theme-text-muted border theme-border">
              {stock.sector}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-xs theme-text-muted">Market Price</span>
              <div className="text-2xl font-extrabold font-mono theme-text-main">
                {currentPrice.toFixed(2)} <span className="text-sm font-bold text-[var(--gain-green)]">IC</span>
              </div>
            </div>
            {userHolding && (
              <div className="text-right">
                <span className="text-xs theme-text-muted">You Own</span>
                <div className="text-sm font-bold font-mono text-[var(--gain-green)]">
                  {userHolding.quantity} shares
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex theme-bg-panel p-1 rounded-xl mb-6 border theme-border">
          <button
            type="button"
            onClick={() => setMode('BUY')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              mode === 'BUY'
                ? 'bg-[var(--gain-green)] text-white shadow-lg'
                : 'theme-text-muted hover:theme-text-main'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            BUY SHARES
          </button>
          <button
            type="button"
            onClick={() => setMode('SELL')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              mode === 'SELL'
                ? 'bg-[var(--loss-red)] text-white shadow-lg'
                : 'theme-text-muted hover:theme-text-main'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            SELL SHARES
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[color-mix(in_srgb,var(--loss-red)_10%,transparent)] border border-[color-mix(in_srgb,var(--loss-red)_30%,transparent)] rounded-xl text-[var(--loss-red)] text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold theme-text-muted">Number of Shares</label>
              <div className="flex gap-1">
                {[1, 5, 10, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuantity(num)}
                    className="px-2 py-0.5 theme-bg-panel hover:theme-bg-card-hover theme-text-main text-[10px] font-mono rounded border theme-border"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full theme-bg-input border theme-border rounded-xl py-2.5 px-3 text-sm theme-text-main font-mono focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="p-4 theme-bg-panel rounded-xl border theme-border space-y-2">
            <div className="flex justify-between text-xs theme-text-muted">
              <span>{mode === 'BUY' ? 'Total Cost' : 'Total You Get'}</span>
              <span className="font-mono theme-text-main font-bold">{totalAmount.toFixed(2)} IC</span>
            </div>
            <div className="flex justify-between text-xs theme-text-muted">
              <span>{mode === 'BUY' ? 'Your Wallet' : 'Your Shares'}</span>
              <span className="font-mono theme-text-main">
                {mode === 'BUY' ? `${userWallet.toFixed(2)} IC` : `${ownedQty} shares`}
              </span>
            </div>
          </div>

          {mode === 'BUY' && !canBuy && (
            <div className="text-[11px] text-[var(--loss-red)] font-semibold text-center">
              You don't have enough money. You need {(totalAmount - userWallet).toFixed(2)} IC more.
            </div>
          )}
          {mode === 'SELL' && !canSell && (
            <div className="text-[11px] text-[var(--loss-red)] font-semibold text-center">
              You only own {ownedQty} shares, so you can't sell {parsedQty}.
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'BUY' ? !canBuy : !canSell)}
            className={`w-full py-3 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all ${
              mode === 'BUY'
                ? 'bg-[var(--gain-green)] hover:opacity-90 text-white'
                : 'bg-[var(--loss-red)] hover:opacity-90 text-white'
            } disabled:opacity-40 disabled:cursor-not-allowed btn-terminal`}
          >
            {loading ? (mode === 'BUY' ? 'Buying...' : 'Selling...') : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>{mode === 'BUY' ? 'BUY NOW' : 'SELL NOW'} ({totalAmount.toFixed(2)} IC)</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
