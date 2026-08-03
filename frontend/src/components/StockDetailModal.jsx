import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../services/api';
import { Sparkline, calculateSMA } from './Sparkline';
import { AnimatedNumber } from './AnimatedNumber';
import { 
  X, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, 
  ShoppingBag, AlertTriangle, Calendar, BarChart2, Activity, Zap, Clock, Ban
} from 'lucide-react';

export function StockDetailModal({ stock, userWallet, userHolding, isOpen, onClose, onSuccess }) {
  const [tradeCategory, setTradeCategory] = useState('INSTANT'); // 'INSTANT' or 'LIMIT'
  const [mode, setMode] = useState('BUY'); // 'BUY' or 'SELL'
  const [quantity, setQuantity] = useState(1);
  const [targetPrice, setTargetPrice] = useState(stock ? stock.currentPrice.toFixed(2) : '10.00');
  const [timeframe, setTimeframe] = useState('1D');
  const [historyData, setHistoryData] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [balanceInfo, setBalanceInfo] = useState({ availableWalletBalance: userWallet, lockedFunds: 0 });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingTrade, setLoadingTrade] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [error, setError] = useState('');

  const fetchStockHistory = useCallback(async (stockId, range) => {
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
  }, [stock]);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await apiFetch('/orders');
      setPendingOrders(data.pendingOrders || []);
      if (data.availableBalance !== undefined) {
        setBalanceInfo({
          availableWalletBalance: data.availableBalance,
          lockedFunds: data.lockedFunds
        });
      }
    } catch (err) {
      console.error('Failed to fetch pending orders:', err);
    }
  }, []);

  useEffect(() => {
    if (stock && isOpen) {
      setQuantity(1);
      setTargetPrice(stock.currentPrice.toFixed(2));
      setError('');
      fetchStockHistory(stock.id, timeframe);
      fetchOrders();
    }
  }, [stock, isOpen, timeframe, fetchStockHistory, fetchOrders]);

  if (!isOpen || !stock) return null;

  const currentPrice = stock.currentPrice;
  const isPositive = stock.percentChange >= 0;
  const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
  const parsedTargetPrice = Math.max(0.01, parseFloat(targetPrice) || currentPrice);
  
  const instantTotal = Math.round(parsedQty * currentPrice * 100) / 100;
  const limitTotal = Math.round(parsedQty * parsedTargetPrice * 100) / 100;

  const activeHistory = historyData.length > 0 ? historyData : stock.priceHistories || [];
  const prices = activeHistory.map((h) => h.price);
  const volumes = activeHistory.map((h) => h.volume || 10000);

  const high24h = prices.length > 0 ? Math.max(...prices) : currentPrice;
  const low24h = prices.length > 0 ? Math.min(...prices) : currentPrice;
  const latestVolume = volumes.length > 0 ? volumes[volumes.length - 1] : 10000;
  const isHighVolume = latestVolume > 35000;

  const smaArray = calculateSMA(activeHistory, 10);
  const latestSMA = smaArray.length > 0 && smaArray[smaArray.length - 1] !== null
    ? smaArray[smaArray.length - 1]
    : currentPrice;

  const ownedQty = userHolding ? userHolding.quantity : 0;
  const availableQty = userHolding && userHolding.availableQuantity !== undefined
    ? userHolding.availableQuantity
    : ownedQty;
  const lockedQty = userHolding && userHolding.lockedQuantity !== undefined
    ? userHolding.lockedQuantity
    : 0;

  const availWallet = balanceInfo.availableWalletBalance !== undefined
    ? balanceInfo.availableWalletBalance
    : userWallet;

  const canInstantBuy = availWallet >= instantTotal;
  const canInstantSell = availableQty >= parsedQty;

  const canLimitBuy = availWallet >= limitTotal;
  const canLimitSell = availableQty >= parsedQty;

  const stockPendingOrders = pendingOrders.filter((o) => o.stockId === stock.id);

  const handleTradeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoadingTrade(true);

    try {
      if (tradeCategory === 'INSTANT') {
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
        fetchOrders();
        onClose();
      } else {
        const data = await apiFetch('/orders', {
          method: 'POST',
          body: JSON.stringify({
            stockId: stock.id,
            type: mode,
            targetPrice: parsedTargetPrice,
            quantity: parsedQty
          })
        });

        if (onSuccess) {
          onSuccess(data.message);
        }
        fetchOrders();
      }
    } catch (err) {
      setError(err.message || 'Order placement failed');
    } finally {
      setLoadingTrade(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    setCancellingOrderId(orderId);
    try {
      const data = await apiFetch(`/orders/${orderId}`, {
        method: 'DELETE'
      });
      if (onSuccess) {
        onSuccess(data.message);
      }
      fetchOrders();
    } catch (err) {
      setError(err.message || 'Failed to cancel limit order');
    } finally {
      setCancellingOrderId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl max-h-[90vh] theme-bg-card rounded-[6px] border theme-border shadow-2xl relative flex flex-col overflow-hidden transition-colors">

        {/* Header */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b theme-border px-6 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3 sm:block">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-bold theme-text-main font-mono">{stock.symbol}</span>
                <span className="px-2 py-0.5 rounded-[3px] text-xs font-bold theme-bg-panel theme-text-muted border theme-border font-mono">
                  {stock.sector}
                </span>
              </div>
              <h2 className="text-xs font-bold theme-text-muted mt-0.5">{stock.name}</h2>
            </div>

            <button
              onClick={onClose}
              className="sm:hidden flex-shrink-0 p-2 rounded-[4px] border theme-border theme-bg-panel theme-text-muted hover:theme-text-main transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center btn-terminal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-3">
              <div>
                <div className="text-[10px] uppercase font-mono font-bold theme-text-dim">Spot Price</div>
                <div className="text-3xl font-extrabold font-mono theme-text-main">
                  <AnimatedNumber value={currentPrice} decimals={2} suffix=" IC" className={isPositive ? 'text-[#1DB954]' : 'text-[#E8453C]'} />
                </div>
              </div>

              <div className={`px-2.5 py-1 rounded-[3px] text-xs font-bold font-mono border flex items-center gap-1 ${
                isPositive
                  ? 'bg-[#1DB954]/10 text-[#1DB954] border-[#1DB954]/30'
                  : 'bg-[#E8453C]/10 text-[#E8453C] border-[#E8453C]/30'
              }`}>
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{isPositive ? '+' : ''}{stock.percentChange.toFixed(2)}%</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="hidden sm:inline-flex flex-shrink-0 p-2 rounded-[4px] border theme-border theme-bg-panel theme-text-muted hover:theme-text-main transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center btn-terminal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-6 py-6 space-y-6">

        {/* Technical Data Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="theme-bg-panel p-3 rounded-[6px] border theme-border">
            <div className="text-[10px] uppercase font-mono font-bold theme-text-dim">24h High</div>
            <div className="text-sm font-bold font-mono theme-text-main mt-0.5">{high24h.toFixed(2)} IC</div>
          </div>
          <div className="theme-bg-panel p-3 rounded-[6px] border theme-border">
            <div className="text-[10px] uppercase font-mono font-bold theme-text-dim">24h Low</div>
            <div className="text-sm font-bold font-mono theme-text-main mt-0.5">{low24h.toFixed(2)} IC</div>
          </div>
          <div className="theme-bg-panel p-3 rounded-[6px] border theme-border">
            <div className="text-[10px] uppercase font-mono font-bold theme-text-dim flex items-center gap-1">
              <span>SMA-10 Trend</span>
              <Activity className="w-3 h-3 text-[#D4A017]" />
            </div>
            <div className="text-sm font-bold font-mono text-[#D4A017] mt-0.5">{latestSMA.toFixed(2)} IC</div>
          </div>
          <div className="theme-bg-panel p-3 rounded-[6px] border theme-border">
            <div className="text-[10px] uppercase font-mono font-bold theme-text-dim flex items-center gap-1">
              <span>Volume</span>
              <BarChart2 className="w-3 h-3 text-indigo-400" />
            </div>
            <div className="text-sm font-bold font-mono text-indigo-300 mt-0.5 flex items-center gap-1.5">
              <span>{latestVolume.toLocaleString()} shrs</span>
              {isHighVolume && (
                <span className="px-1.5 py-0.2 bg-[#D4A017]/20 text-[#D4A017] text-[9px] font-extrabold rounded-[2px] border border-[#D4A017]/40">
                  HIGH
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Chart */}
        <div className="theme-bg-panel p-4 rounded-[6px] border theme-border space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1DB954] inline-block" />
                <span className="font-semibold theme-text-main">Spot Price</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-[#D4A017] inline-block border-dashed" />
                <span className="font-semibold text-[#D4A017]">SMA-10</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2.5 bg-indigo-500/60 inline-block" />
                <span className="font-semibold theme-text-muted">Volume</span>
              </div>
            </div>

            <div className="flex theme-bg-card p-1 rounded-[4px] border theme-border self-start sm:self-auto">
              {['1D', '1W', '1M'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-xs font-bold font-mono rounded-[3px] transition-all min-h-[30px] ${
                    timeframe === tf
                      ? 'bg-[#D4A017] text-slate-950 shadow-sm'
                      : 'theme-text-muted hover:theme-text-main'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

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

        {/* Trade Order Panel */}
        <div className="theme-bg-panel p-5 rounded-[6px] border theme-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex theme-bg-card p-1 rounded-[4px] border theme-border">
              <button
                type="button"
                onClick={() => setTradeCategory('INSTANT')}
                className={`px-4 py-1.5 text-xs font-bold font-heading rounded-[3px] flex items-center gap-1.5 transition-all min-h-[34px] ${
                  tradeCategory === 'INSTANT'
                    ? 'bg-[#D4A017] text-slate-950 shadow-sm'
                    : 'theme-text-muted hover:theme-text-main'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Instant Trade
              </button>
              <button
                type="button"
                onClick={() => setTradeCategory('LIMIT')}
                className={`px-4 py-1.5 text-xs font-bold font-heading rounded-[3px] flex items-center gap-1.5 transition-all min-h-[34px] ${
                  tradeCategory === 'LIMIT'
                    ? 'bg-[#D4A017] text-slate-950 shadow-sm'
                    : 'theme-text-muted hover:theme-text-main'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Limit Order (Pre-Book)
              </button>
            </div>

            {userHolding && (
              <div className="text-right text-xs font-mono">
                <span className="text-[#1DB954] font-bold block">
                  Owned: {ownedQty} shares (Avg: {userHolding.avgBuyPrice.toFixed(2)} IC)
                </span>
                {lockedQty > 0 && (
                  <span className="text-[#D4A017] text-[10px] block">
                    Available: {availableQty} | Locked in orders: {lockedQty}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* BUY / SELL Toggle Buttons */}
          <div className="flex theme-bg-card p-1 rounded-[4px] border theme-border">
            <button
              type="button"
              onClick={() => setMode('BUY')}
              className={`flex-1 py-2 text-xs font-bold font-heading rounded-[3px] flex items-center justify-center gap-1.5 transition-all min-h-[40px] ${
                mode === 'BUY'
                  ? 'bg-[#1DB954] text-slate-950 shadow'
                  : 'theme-text-muted hover:theme-text-main'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              {tradeCategory === 'INSTANT' ? 'BUY SHARES' : 'LIMIT BUY'}
            </button>
            <button
              type="button"
              onClick={() => setMode('SELL')}
              className={`flex-1 py-2 text-xs font-bold font-heading rounded-[3px] flex items-center justify-center gap-1.5 transition-all min-h-[40px] ${
                mode === 'SELL'
                  ? 'bg-[#E8453C] text-white shadow'
                  : 'theme-text-muted hover:theme-text-main'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              {tradeCategory === 'INSTANT' ? 'SELL SHARES' : 'LIMIT SELL'}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-[#E8453C]/10 border border-[#E8453C]/30 rounded-[4px] text-[#E8453C] text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleTradeSubmit} className="space-y-4">
            
            {tradeCategory === 'LIMIT' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-[#D4A017] flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    Target Trigger Price (IC)
                  </label>
                  <span className="text-[10px] theme-text-dim font-mono">
                    Spot: {currentPrice.toFixed(2)} IC
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full theme-bg-card border border-[#D4A017]/40 rounded-[4px] py-2 px-3 text-sm theme-text-main font-mono focus:outline-none focus:border-[#D4A017]"
                />
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold theme-text-muted font-heading">Quantity (Shares)</label>
                <div className="flex gap-1">
                  {[1, 5, 10, 50, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuantity(num)}
                      className="px-2.5 py-1 theme-bg-card theme-bg-card-hover theme-text-main text-[10px] font-mono rounded-[3px] border theme-border min-h-[30px] btn-terminal"
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
                className="w-full theme-bg-card border theme-border rounded-[4px] py-2 px-3 text-sm theme-text-main font-mono focus:outline-none focus:border-[#D4A017]"
              />
            </div>

            <div className="p-3 theme-bg-card rounded-[4px] border theme-border flex justify-between items-center text-xs">
              <div>
                <span className="theme-text-muted font-mono">
                  {tradeCategory === 'INSTANT' 
                    ? (mode === 'BUY' ? 'Total Cost:' : 'Total Proceeds:')
                    : (mode === 'BUY' ? 'Target Reserved Funds:' : 'Target Proceeds:')
                  }
                </span>
                <div className="text-base font-extrabold font-mono theme-text-main mt-0.5">
                  {(tradeCategory === 'INSTANT' ? instantTotal : limitTotal).toFixed(2)} <span className="text-[#D4A017]">IC</span>
                </div>
              </div>

              <div className="text-right">
                <span className="theme-text-muted font-mono">
                  {mode === 'BUY' ? 'Available Wallet Balance:' : 'Available Shares:'}
                </span>
                <div className="text-xs font-bold font-mono theme-text-main mt-0.5">
                  {mode === 'BUY' 
                    ? `${availWallet.toFixed(2)} IC ${balanceInfo.lockedFunds > 0 ? `(${balanceInfo.lockedFunds.toFixed(2)} IC locked)` : ''}` 
                    : `${availableQty} shares ${lockedQty > 0 ? `(${lockedQty} locked)` : ''}`
                  }
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingTrade || (
                tradeCategory === 'INSTANT'
                  ? (mode === 'BUY' ? !canInstantBuy : !canInstantSell)
                  : (mode === 'BUY' ? !canLimitBuy : !canLimitSell)
              )}
              className={`w-full py-3 font-bold text-xs font-mono uppercase rounded-[4px] shadow flex items-center justify-center gap-2 transition-all min-h-[44px] btn-terminal ${
                mode === 'BUY'
                  ? (tradeCategory === 'INSTANT' ? 'bg-[#1DB954] hover:bg-[#1DB954]/90 text-slate-950' : 'bg-[#D4A017] hover:bg-[#D4A017]/90 text-slate-950')
                  : 'bg-[#E8453C] hover:bg-[#E8453C]/90 text-white'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {loadingTrade ? 'PROCESSING ORDER...' : (
                <>
                  {tradeCategory === 'INSTANT' ? <ShoppingBag className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  <span>
                    {tradeCategory === 'INSTANT'
                      ? `EXECUTE ${mode} ORDER (${parsedQty} SHARES @ ${instantTotal.toFixed(2)} IC)`
                      : `PLACE LIMIT ${mode} ORDER (${parsedQty} SHARES AT ${parsedTargetPrice.toFixed(2)} IC)`
                    }
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Active Pending Limit Orders */}
        {stockPendingOrders.length > 0 && (
          <div className="theme-bg-panel p-4 rounded-[6px] border theme-border space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#D4A017] uppercase tracking-wider font-mono">
              <Clock className="w-4 h-4" />
              <span>Pending Limit Orders for {stock.symbol}</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {stockPendingOrders.map((order) => (
                <div key={order.id} className="p-3 theme-bg-card rounded-[4px] border theme-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.2 rounded-[2px] text-[10px] font-extrabold ${
                      order.type === 'BUY'
                        ? 'bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30'
                        : 'bg-[#E8453C]/20 text-[#E8453C] border border-[#E8453C]/30'
                    }`}>
                      LIMIT {order.type}
                    </span>
                    <div>
                      <span className="font-bold theme-text-main">{order.quantity} shares</span>
                      <span className="theme-text-muted ml-2">@ Target: <strong className="text-[#D4A017]">{order.targetPrice.toFixed(2)} IC</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancellingOrderId === order.id}
                      className="px-2.5 py-1 bg-[#E8453C]/10 hover:bg-[#E8453C]/20 text-[#E8453C] border border-[#E8453C]/30 text-[11px] font-bold rounded-[3px] flex items-center gap-1 transition-all btn-terminal"
                    >
                      <Ban className="w-3 h-3" />
                      {cancellingOrderId === order.id ? '...' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        </div>

      </div>
    </div>
  );
}