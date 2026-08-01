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
        onSuccess(data.message, data.portfolio);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Trade execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-white font-mono">{stock.symbol}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
              {stock.sector}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400">Current Market Price</span>
              <div className="text-2xl font-extrabold font-mono text-white">
                {currentPrice.toFixed(2)} <span className="text-sm font-bold text-emerald-400">IC</span>
              </div>
            </div>
            {userHolding && (
              <div className="text-right">
                <span className="text-xs text-slate-400">You Own</span>
                <div className="text-sm font-bold font-mono text-emerald-400">
                  {userHolding.quantity} shares
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex bg-slate-900/90 p-1 rounded-xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('BUY')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              mode === 'BUY'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
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
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            SELL SHARES
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300">Quantity (Shares)</label>
              <div className="flex gap-1">
                {[1, 5, 10, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuantity(num)}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono rounded border border-slate-700"
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
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>{mode === 'BUY' ? 'Est. Total Cost' : 'Est. Total Proceeds'}</span>
              <span className="font-mono text-white font-bold">{totalAmount.toFixed(2)} IC</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{mode === 'BUY' ? 'Available Wallet' : 'Owned Shares'}</span>
              <span className="font-mono text-slate-300">
                {mode === 'BUY' ? `${userWallet.toFixed(2)} IC` : `${ownedQty} shares`}
              </span>
            </div>
          </div>

          {mode === 'BUY' && !canBuy && (
            <div className="text-[11px] text-rose-400 font-semibold text-center">
              ⚠️ Insufficient wallet balance. You need ${(totalAmount - userWallet).toFixed(2)} IC more.
            </div>
          )}
          {mode === 'SELL' && !canSell && (
            <div className="text-[11px] text-rose-400 font-semibold text-center">
              ⚠️ You own {ownedQty} shares, but tried to sell {parsedQty}.
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'BUY' ? !canBuy : !canSell)}
            className={`w-full py-3 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all ${
              mode === 'BUY'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {loading ? 'Executing Trade...' : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>CONFIRM {mode} ORDER ({totalAmount.toFixed(2)} IC)</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
