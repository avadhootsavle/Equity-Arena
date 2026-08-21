import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { RefreshCw, AlertCircle } from 'lucide-react';

export function AdminTraderDetailModal({ traderId, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (traderId && isOpen) {
      fetchTraderDetail(traderId);
    }
  }, [traderId, isOpen]);

  const fetchTraderDetail = async (id) => {
    setLoading(true);
    setError('');
    try {
      const result = await apiFetch(`/admin/trader/${id}`);
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to fetch trader details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 font-mono animate-fadeIn">
      <div className="w-full max-w-2xl h-full bg-[#0D0D0D] border-l border-[#2A2A2A] p-6 space-y-6 overflow-y-auto relative text-white">
        
        {/* Close Button & Header */}
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-[#666666]">TRADER MONITORING AUDIT</div>
            <h2 className="text-base font-bold text-white mt-0.5">
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
            <div className="grid grid-cols-3 gap-3 border border-[#2A2A2A] rounded-[4px] bg-[#111111] p-3">
              <div>
                <span className="text-[10px] uppercase text-[#666666] block">TRADER NAME</span>
                <span className="text-sm font-bold text-white block truncate">{data.trader.name}</span>
                <span className="text-[10px] text-[#888888] block truncate">{data.trader.email}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-[#666666] block">CASH BALANCE</span>
                <span className="text-sm font-bold text-[#3FB950] block mt-0.5">
                  {data.trader.walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} IC
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-[#666666] block">PORTFOLIO NET WORTH</span>
                <span className="text-sm font-bold text-white block mt-0.5">
                  {data.trader.totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} IC
                </span>
              </div>
            </div>

            {/* Holdings Section */}
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-[0.08em] text-[#666666]">ACTIVE HOLDINGS ({data.holdings.length})</div>
              <div className="border border-[#2A2A2A] rounded-[4px] overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#2A2A2A] bg-[#111111] text-[#666666] uppercase text-[10px]">
                      <th className="py-2 px-3">Stock</th>
                      <th className="py-2 px-3 text-right">Shares</th>
                      <th className="py-2 px-3 text-right">Avg Buy</th>
                      <th className="py-2 px-3 text-right">P/L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F1F]">
                    {data.holdings.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-[#666666] italic">
                          No active stock positions held
                        </td>
                      </tr>
                    ) : (
                      data.holdings.map((h) => {
                        const isPos = h.unrealizedPL >= 0;
                        return (
                          <tr key={h.id} className="hover:bg-[#161616]">
                            <td className="py-2 px-3">
                              <span className="font-bold text-white">{h.symbol}</span>
                              <span className="text-[10px] text-[#888888] ml-2">{h.name}</span>
                            </td>
                            <td className="py-2 px-3 text-right text-white">{h.quantity}</td>
                            <td className="py-2 px-3 text-right text-[#888888]">{h.avgBuyPrice.toFixed(2)} IC</td>
                            <td className={`py-2 px-3 text-right font-bold ${isPos ? 'text-[#3FB950]' : 'text-[#F85149]'}`}>
                              {isPos ? '+' : ''}{h.unrealizedPL.toFixed(2)} IC
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transactions Section */}
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-[0.08em] text-[#666666]">TRANSACTION HISTORY ({data.transactions.length})</div>
              <div className="border border-[#2A2A2A] rounded-[4px] bg-[#111111] p-2 space-y-1.5 max-h-64 overflow-y-auto">
                {data.transactions.length === 0 ? (
                  <div className="py-4 text-center text-[#666666] italic">
                    No trades executed yet
                  </div>
                ) : (
                  data.transactions.map((tx) => {
                    const isBuy = tx.type === 'BUY';
                    return (
                      <div key={tx.id} className="p-2 bg-[#161616] border border-[#2A2A2A] rounded-[4px] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold ${isBuy ? 'text-[#3FB950]' : 'text-[#F85149]'}`}>
                            {tx.type}
                          </span>
                          <span className="font-bold text-white">{tx.stock?.symbol || 'STOCK'}</span>
                          <span className="text-[#888888] text-[10px]">({tx.quantity} shares @ {tx.price.toFixed(2)} IC)</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-white">{(tx.quantity * tx.price).toFixed(2)} IC</span>
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
