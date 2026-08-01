import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { Sparkline, calculateSMA } from './Sparkline';
import { 
  X, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, 
  ShoppingBag, AlertTriangle, Calendar, BarChart2, Activity, Zap
} from 'lucide-react';

export function StockDetailModal({ stock, userWallet, userHolding, isOpen, onClose, onSuccess }) {
  const [mode, setMode] = useState('BUY');
  const [quantity, setQuantity] = useState(1);
  const [timeframe, setTimeframe] = useState('1D');
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingTrade, setLoadingTrade] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (stock && isOpen) {
      setQuantity(1);
      setError('');
      fetchStockHistory(stock.id, timeframe);
    }
  }, [stock, isOpen, timeframe]);

  const fetchStockHistory = async (stockId, range) => {
    setLoadingHistory(true);
    try {
      const history = await apiFetch(`/stocks/${stockId}/history?range=${range}`);
      setHistoryData(history);
    } catch (err) {
      console.error('Failed to fetch stock detail history:', err);
      setHistoryData(stock?.priceHistories || []);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen || !stock) return null;

  const currentPrice = stock.currentPrice;
  const isPositive = stock.percentChange >= 0;
  const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
  const totalAmount = Math.round(parsedQty * currentPrice * 100) / 100;

  const activeHistory = historyData.length > 0 ? historyData : stock.priceHistories || [];
  const prices = activeHistory.map((h) => h.price);
  const volumes = activeHistory.map((h) => h.volume || 10000);

  const high24h = prices.length > 0 ? Math.max(...prices) : currentPrice;
  const low24h = prices.length > 0 ? Math.min(...prices) : currentPrice;
  const latestVolume = volumes.length > 0 ? volumes[volumes.length - 1] : 10000;
  const isHighVolume = latestVolume > 35000; // High volume signal flag!

  const smaArray = calculateSMA(activeHistory, 10);
  const latestSMA = smaArray.length > 0 && smaArray[smaArray.length - 1] !== null
    ? smaArray[smaArray.length - 1]
    : currentPrice;

  const ownedQty = userHolding ? userHolding.quantity : 0;
  const canBuy = userWallet >= totalAmount;
  const canSell = ownedQty >= parsedQty;

  const handleTradeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoadingTrade(true);

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
      setLoadingTrade(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-3xl glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl relative space-y-6 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Stock Detail Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 pr-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-extrabold text-white font-mono">{stock.symbol}</span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {stock.sector}
              </span>
            </div>
            <h2 className="text-sm font-semibold text-slate-300 mt-0.5">{stock.name}</h2>
          </div>

          <div className="flex items-baseline gap-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Current Market Price</div>
              <div className="text-3xl font-extrabold font-mono text-white">
                {currentPrice.toFixed(2)} <span className="text-lg font-bold text-emerald-400">IC</span>
              </div>
            </div>

            <div className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border flex items-center gap-1 ${
              isPositive
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{isPositive ? '+' : ''}{stock.percentChange.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Analyst Technical Data Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[10px] uppercase font-bold text-slate-400">24h High</div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">{high24h.toFixed(2)} IC</div>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[10px] uppercase font-bold text-slate-400">24h Low</div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">{low24h.toFixed(2)} IC</div>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <span>SMA-10 Trend</span>
              <Activity className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">{latestSMA.toFixed(2)} IC</div>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <span>Volume</span>
              <BarChart2 className="w-3 h-3 text-indigo-400" />
            </div>
            <div className="text-sm font-bold font-mono text-indigo-300 mt-0.5 flex items-center gap-1.5">
              <span>{latestVolume.toLocaleString()} shrs</span>
              {isHighVolume && (
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[9px] font-extrabold rounded border border-amber-500/40 animate-pulse">
                  HIGH
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Full-Size Interactive Chart (Price + SMA-10 + Volume Bars) */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                <span className="font-semibold text-slate-200">Spot Price</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-amber-400 inline-block border-dashed" />
                <span className="font-semibold text-amber-300">SMA-10</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2.5 bg-indigo-500/60 inline-block" />
                <span className="font-semibold text-slate-400">Volume</span>
              </div>
            </div>

            {/* Timeframe Toggles */}
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
              {['1D', '1W', '1M'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-xs font-bold font-mono rounded transition-all ${
                    timeframe === tf
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Large Sparkline Chart with SMA-10 and Volume Bars */}
          <div className="h-52 flex items-center justify-center pt-2">
            <Sparkline
              history={activeHistory}
              width={650}
              height={190}
              showSMA={true}
              showVolume={true}
            />
          </div>
        </div>

        {/* Embedded Trade Order Panel */}
        <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Execute Trade Order</span>
            {userHolding && (
              <span className="text-xs font-mono text-emerald-400 font-bold">
                Owned Position: {userHolding.quantity} shares (Avg: {userHolding.avgBuyPrice.toFixed(2)} IC)
              </span>
            )}
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
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
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleTradeSubmit} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">Quantity (Shares)</label>
                <div className="flex gap-1">
                  {[1, 5, 10, 50, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuantity(num)}
                      className="px-2.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono rounded border border-slate-700"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-400">{mode === 'BUY' ? 'Total Order Cost:' : 'Total Order Proceeds:'}</span>
                <div className="text-base font-extrabold font-mono text-white mt-0.5">
                  {totalAmount.toFixed(2)} <span className="text-emerald-400">IC</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-400">{mode === 'BUY' ? 'Available Wallet Balance:' : 'Owned Shares:'}</span>
                <div className="text-xs font-bold font-mono text-slate-300 mt-0.5">
                  {mode === 'BUY' ? `${userWallet.toFixed(2)} IC` : `${ownedQty} shares`}
                </div>
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
              disabled={loadingTrade || (mode === 'BUY' ? !canBuy : !canSell)}
              className={`w-full py-3 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all ${
                mode === 'BUY'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {loadingTrade ? 'Executing Order...' : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>CONFIRM {mode} ORDER ({totalAmount.toFixed(2)} IC)</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
