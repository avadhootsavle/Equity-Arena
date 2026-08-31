import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

const fmtMoney = (n, d = 2) =>
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  });

export function AdminTraderDetailModal({ traderId, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Top-Up state & inline confirm
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const [confirmTopUp, setConfirmTopUp] = useState(false);
  const [topUpTimer, setTopUpTimer] = useState(null);

  // Stock adjustment state & inline confirm
  const [customPercents, setCustomPercents] = useState({});
  const [adjustingStockId, setAdjustingStockId] = useState(null);
  const [confirmStockAdj, setConfirmStockAdj] = useState(null);

  const { socket } = useSocket();

  useEffect(() => {
    if (traderId && isOpen) {
      fetchTraderDetail(traderId, true);

      // Auto-refresh periodically (every 4s) while the drill-down modal is open
      const pollTimer = setInterval(() => {
        fetchTraderDetail(traderId, false);
      }, 4000);

      return () => clearInterval(pollTimer);
    }
  }, [traderId, isOpen]);

  // Real-time socket event listening for this specific trader
  useEffect(() => {
    if (!socket || !isOpen || !traderId) return;

    const onLiveEvent = (payload) => {
      // If activity, trade, or stock price changes, refresh this trader's detail silently
      fetchTraderDetail(traderId, false);
    };

    socket.on('stock:update', onLiveEvent);
    socket.on('stocks:batch-update', onLiveEvent);
    socket.on('order:executed', onLiveEvent);
    socket.on('activity:log', onLiveEvent);
    socket.on('leaderboard:update', onLiveEvent);

    return () => {
      socket.off('stock:update', onLiveEvent);
      socket.off('stocks:batch-update', onLiveEvent);
      socket.off('order:executed', onLiveEvent);
      socket.off('activity:log', onLiveEvent);
      socket.off('leaderboard:update', onLiveEvent);
    };
  }, [socket, isOpen, traderId]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const fetchTraderDetail = async (id, isInitial = false) => {
    if (isInitial) setLoading(true);
    setError('');
    try {
      const result = await apiFetch(`/admin/trader/${id}`);
      setData(result);
    } catch (err) {
      if (isInitial) setError(err.message || 'Failed to fetch trader details');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const handleTopUpClick = () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) return;
    setConfirmTopUp(true);
    if (topUpTimer) clearTimeout(topUpTimer);
    const timer = setTimeout(() => setConfirmTopUp(false), 8000);
    setTopUpTimer(timer);
  };

  const handleCancelTopUp = () => {
    if (topUpTimer) clearTimeout(topUpTimer);
    setConfirmTopUp(false);
  };

  // Admin manual top-up handler
  const handleGiveTopUp = async () => {
    if (topUpTimer) clearTimeout(topUpTimer);
    setConfirmTopUp(false);

    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsTopUpLoading(true);
    try {
      const res = await apiFetch(`/admin/trader/${traderId}/topup`, {
        method: 'POST',
        body: JSON.stringify({ amount })
      });

      showToast(res.message || `Added ${amount.toLocaleString()} IC to wallet`);
      setTopUpAmount('');
      fetchTraderDetail(traderId);
    } catch (err) {
      setError(err.message || 'Failed to top-up wallet');
    } finally {
      setIsTopUpLoading(false);
    }
  };

  const handleCustomApplyClick = (stockId, symbol) => {
    const percent = parseFloat(customPercents[stockId]);
    if (isNaN(percent)) return;
    if (confirmStockAdj?.timer) clearTimeout(confirmStockAdj.timer);
    const timer = setTimeout(() => setConfirmStockAdj(null), 8000);
    setConfirmStockAdj({ stockId, symbol, percent, timer });
  };

  const handleCancelCustomAdj = () => {
    if (confirmStockAdj?.timer) clearTimeout(confirmStockAdj.timer);
    setConfirmStockAdj(null);
  };

  // Global stock adjustment inside trader detail view
  const handleAdjustStockPrice = async (stockId, percent) => {
    if (confirmStockAdj?.timer) clearTimeout(confirmStockAdj.timer);
    setConfirmStockAdj(null);

    setAdjustingStockId(stockId);
    try {
      const res = await apiFetch(`/admin/stock/${stockId}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ percent })
      });
      const sign = percent >= 0 ? '+' : '';
      showToast(`${res.stock.symbol} adjusted ${sign}${percent}% → ${res.stock.currentPrice.toFixed(2)} IC`);
      setCustomPercents((prev) => ({ ...prev, [stockId]: '' }));
      fetchTraderDetail(traderId);
    } catch (err) {
      setError(err.message || 'Failed to adjust stock price');
    } finally {
      setAdjustingStockId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 font-sans animate-fadeIn backdrop-blur-xs">
      <div className="w-full max-w-2xl h-full bg-[#0F1117] border-l border-[#2D3142] p-6 space-y-6 overflow-y-auto relative text-[#F0F2FF]">
        
        {/* Toast Popup inside modal */}
        {toastMsg && (
          <div className="p-3 bg-[#22C55E]/10 border border-[#22C55E]/40 text-[#22C55E] rounded-lg text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Close Button & Header */}
        <div className="flex items-center justify-between border-b border-[#2D3142] pb-4">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-[0.12em] text-[#7B82A0]">TRADER MONITORING AUDIT</div>
            <h2 className="text-lg font-extrabold text-[#F0F2FF] mt-0.5">
              {data?.trader?.name || 'Trader Audit'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchTraderDetail(traderId)}
              disabled={loading}
              className="px-3 py-1 text-xs uppercase font-bold border border-[#3A3A3A] text-white hover:bg-white/10 rounded-[4px] transition-all flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              REFRESH
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 text-xs font-bold border border-[#3A3A3A] text-[#888888] hover:text-white rounded-[4px] transition-colors"
            >
              X
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[#888888] text-xs">
            Loading trader portfolio and transaction logs...
          </div>
        ) : error ? (
          <div className="p-3 bg-[#F85149]/10 border border-[#F85149] text-[#F85149] rounded-[4px] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : data ? (
          <div className="space-y-6 text-xs">
            
            {/* Top Metric Strip */}
            <div className="grid grid-cols-3 gap-3 bg-[#1A1D27] border border-[#2D3142] rounded-lg p-3">
              <div>
                <span className="text-[10px] uppercase text-[#666666] block">TRADER NAME</span>
                <span className="text-sm font-bold text-white block truncate">{data.trader.name}</span>
                <span className="text-[10px] text-[#888888] block truncate">{data.trader.email}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-[#666666] block">CASH BALANCE</span>
                <span className="text-sm font-bold text-[#3FB950] block mt-0.5">
                  {fmtMoney(data.trader.walletBalance)} IC
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-[#666666] block">PORTFOLIO NET WORTH</span>
                <span className="text-sm font-bold text-white block mt-0.5">
                  {fmtMoney(data.trader.totalPortfolioValue)} IC
                </span>
              </div>
            </div>

            {/* FIX 4: MANUAL IC TOP-UP CONTROL WITH INLINE CONFIRM */}
            <div className="p-3 bg-[#111111] border border-[#2A2A2A] rounded-[4px] space-y-2 font-mono">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[11px] font-bold text-[#F0B429] uppercase">GIVE EXTRA COINS:</span>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <input
                    type="number"
                    min="1"
                    placeholder="Amount in IC"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="w-36 h-[32px] bg-[#0D0D0D] border border-[#3A3A3A] rounded-[4px] px-2.5 text-xs text-white focus:outline-none focus:border-[#F0B429]"
                  />
                  {!confirmTopUp ? (
                    <button
                      type="button"
                      disabled={isTopUpLoading || !topUpAmount || parseFloat(topUpAmount) <= 0}
                      onClick={handleTopUpClick}
                      className="h-[32px] px-4 text-xs uppercase font-bold text-[#F0B429] border border-[#F0B429] rounded-[4px] hover:bg-[#F0B429]/10 transition-colors disabled:opacity-50"
                    >
                      GIVE
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Inline Confirmation Drawer for Give IC */}
              {confirmTopUp && (
                <div className="p-2 bg-[#0D0D0D] border border-[#F0B429] rounded-[4px] flex items-center justify-between text-xs animate-fadeIn">
                  <span className="text-white font-bold">
                    Add {parseFloat(topUpAmount || 0).toLocaleString()} IC to {data.trader.name}?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGiveTopUp}
                      disabled={isTopUpLoading}
                      className="px-3 py-1 uppercase font-bold text-[#F0B429] border border-[#F0B429] rounded-[4px] hover:bg-[#F0B429]/10"
                    >
                      {isTopUpLoading ? 'GIVING...' : 'CONFIRM'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelTopUp}
                      className="px-2.5 py-1 text-[#888888] hover:text-white"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* FIX 2: ACTIVE HOLDINGS WITH PER-HOLDING PRICE CONTROLS & P/L */}
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-[0.08em] text-[#666666]">
                ACTIVE HOLDINGS & STOCK PRICE CONTROLS ({data.holdings.length})
              </div>

              {data.holdings.length === 0 ? (
                <div className="p-4 bg-[#1A1D27] border border-[#2D3142] rounded-lg text-center text-[#666666] italic">
                  No active stock positions held by this trader
                </div>
              ) : (
                <div className="space-y-2">
                  {data.holdings.map((h, i) => {
                    const isPos = h.unrealizedPL >= 0;
                    const isAdjusting = adjustingStockId === h.stockId;
                    const isConfirmingCustom = confirmStockAdj?.stockId === h.stockId;

                    return (
                      <div key={h.id || h.stockId || `h-${i}`} className="p-3 bg-[#111111] border border-[#2A2A2A] rounded-[4px] space-y-2 font-mono">
                        {/* Holding Row */}
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white text-sm mr-2">{h.symbol}</span>
                            <span className="text-[#888888] text-[11px]">{h.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-bold">{h.quantity} shares @ {fmtMoney(h.currentPrice)} IC</span>
                            <span className="block text-[10px] text-[#888888]">Avg Cost: {fmtMoney(h.avgBuyPrice)} IC</span>
                          </div>
                        </div>

                        {/* P/L Metrics for this trader on this stock */}
                        <div className="flex items-center justify-between text-[11px] border-t border-[#1F1F1F] pt-2">
                          <span className="text-[#666666]">Holding P/L:</span>
                          <span className={`font-bold ${isPos ? 'text-[#3FB950]' : 'text-[#F85149]'}`}>
                            {isPos ? `+${fmtMoney(h.unrealizedPL)}` : fmtMoney(h.unrealizedPL)} IC
                          </span>
                        </div>

                        {/* Direct Stock Adjustment Controls inside Trader Detail View */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] uppercase text-[#666666] mr-1">ADJUST PRICE:</span>
                          <button
                            type="button"
                            disabled={isAdjusting}
                            onClick={() => handleAdjustStockPrice(h.stockId, 10)}
                            className="h-[26px] px-2 text-[10px] font-bold rounded-[4px] border border-[#3A3A3A] text-white hover:bg-white/10"
                          >
                            +10%
                          </button>
                          <button
                            type="button"
                            disabled={isAdjusting}
                            onClick={() => handleAdjustStockPrice(h.stockId, 25)}
                            className="h-[26px] px-2 text-[10px] font-bold rounded-[4px] border border-[#3A3A3A] text-white hover:bg-white/10"
                          >
                            +25%
                          </button>
                          <button
                            type="button"
                            disabled={isAdjusting}
                            onClick={() => handleAdjustStockPrice(h.stockId, -10)}
                            className="h-[26px] px-2 text-[10px] font-bold rounded-[4px] border border-[#3A3A3A] text-white hover:bg-white/10"
                          >
                            -10%
                          </button>
                          <button
                            type="button"
                            disabled={isAdjusting}
                            onClick={() => handleAdjustStockPrice(h.stockId, -25)}
                            className="h-[26px] px-2 text-[10px] font-bold rounded-[4px] border border-[#3A3A3A] text-white hover:bg-white/10"
                          >
                            -25%
                          </button>
                          <input
                            type="number"
                            placeholder="%"
                            value={customPercents[h.stockId] || ''}
                            onChange={(e) => setCustomPercents({ ...customPercents, [h.stockId]: e.target.value })}
                            className="w-12 h-[26px] bg-[#0D0D0D] border border-[#3A3A3A] rounded-[4px] px-1 text-center text-[10px] text-white focus:outline-none focus:border-[#F0B429]"
                          />
                          <button
                            type="button"
                            disabled={isAdjusting || !customPercents[h.stockId]}
                            onClick={() => handleCustomApplyClick(h.stockId, h.symbol)}
                            className="h-[26px] px-2 text-[10px] font-bold uppercase rounded-[4px] border border-[#F0B429] text-[#F0B429] hover:bg-[#F0B429]/10"
                          >
                            APPLY
                          </button>
                        </div>

                        {/* Inline Confirm Drawer for Custom % Adjustment */}
                        {isConfirmingCustom && (
                          <div className="p-2 bg-[#0D0D0D] border border-[#F0B429] rounded-[4px] flex items-center justify-between text-xs animate-fadeIn">
                            <span className="text-white font-bold">
                              Move {confirmStockAdj.symbol} price by {confirmStockAdj.percent >= 0 ? '+' : ''}{confirmStockAdj.percent}%?
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleAdjustStockPrice(confirmStockAdj.stockId, confirmStockAdj.percent)}
                                disabled={isAdjusting}
                                className="px-3 py-0.5 uppercase font-bold text-[#F0B429] border border-[#F0B429] rounded-[4px] hover:bg-[#F0B429]/10"
                              >
                                CONFIRM
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelCustomAdj}
                                className="px-2 py-0.5 text-[#888888] hover:text-white"
                              >
                                CANCEL
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Transactions Section */}
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-[0.08em] text-[#666666]">TRANSACTION HISTORY ({data.transactions.length})</div>
              <div className="bg-[#1A1D27] border border-[#2D3142] rounded-lg p-2 space-y-1.5 max-h-64 overflow-y-auto">
                {data.transactions.length === 0 ? (
                  <div className="py-4 text-center text-[#666666] italic">
                    No trades executed yet
                  </div>
                ) : (
                  data.transactions.map((tx) => {
                    const isBuy = tx.type === 'BUY';
                    const isBonus = tx.quantity === 0;

                    return (
                      <div key={tx.id} className="p-2 bg-[#161616] border border-[#2A2A2A] rounded-[4px] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold ${isBonus ? 'text-[#F0B429]' : isBuy ? 'text-[#3FB950]' : 'text-[#F85149]'}`}>
                            {isBonus ? 'BONUS CREDIT' : tx.type}
                          </span>
                          {!isBonus && <span className="font-bold text-white">{tx.stock?.symbol || 'STOCK'}</span>}
                          {isBonus ? (
                            <span className="text-white font-bold">Bonus credit: +{fmtMoney(tx.price)} IC from admin</span>
                          ) : (
                            <span className="text-[#888888] text-[10px]">({tx.quantity} shares @ {fmtMoney(tx.price)} IC)</span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-white">{fmtMoney(isBonus ? tx.price : tx.quantity * tx.price)} IC</span>
                          <span className="text-[10px] text-[#666666] ml-2">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
}
