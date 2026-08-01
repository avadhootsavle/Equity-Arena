import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { X, User, Wallet, PieChart, History, AlertCircle, RefreshCw } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-4xl glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl relative space-y-6 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 pr-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                TRADER MONITORING DRILL-DOWN
              </h2>
              <p className="text-xs text-slate-400">Real-time player portfolio, positions & activity history</p>
            </div>
          </div>

          <button
            onClick={() => fetchTraderDetail(traderId)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Loading trader portfolio and transaction logs...
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : data ? (
          <div className="space-y-6">
            
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Trader Profile</div>
                <div className="text-base font-extrabold text-white mt-0.5 truncate">{data.trader.name}</div>
                <div className="text-xs text-slate-400 truncate">{data.trader.email}</div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Wallet Balance</span>
                </div>
                <div className="text-lg font-extrabold font-mono text-emerald-400 mt-1">
                  {data.trader.walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} IC
                </div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <PieChart className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Total Portfolio Value</span>
                </div>
                <div className="text-lg font-extrabold font-mono text-white mt-1">
                  {data.trader.totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} IC
                </div>
              </div>
            </div>

            {/* Split Grid: Holdings & Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Holdings (6 cols) */}
              <div className="lg:col-span-6 bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                  Active Holdings ({data.holdings.length})
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-auto max-h-64">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                        <th className="py-2 px-2">Stock</th>
                        <th className="py-2 px-2 text-right">Shares</th>
                        <th className="py-2 px-2 text-right">Avg Buy</th>
                        <th className="py-2 px-2 text-right">P/L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {data.holdings.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-500 italic">
                            No active holdings
                          </td>
                        </tr>
                      ) : (
                        data.holdings.map((h) => {
                          const isPos = h.unrealizedPL >= 0;
                          return (
                            <tr key={h.id} className="hover:bg-slate-800/40">
                              <td className="py-2 px-2">
                                <span className="font-bold text-white font-mono">{h.symbol}</span>
                                <div className="text-[10px] text-slate-400 truncate max-w-[100px]">{h.name}</div>
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-slate-200">{h.quantity}</td>
                              <td className="py-2 px-2 text-right font-mono text-slate-300">{h.avgBuyPrice.toFixed(2)} IC</td>
                              <td className={`py-2 px-2 text-right font-mono font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
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

              {/* Transactions (6 cols) */}
              <div className="lg:col-span-6 bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Transaction History ({data.transactions.length})</span>
                </div>

                <div className="flex-1 overflow-y-auto max-h-64 space-y-2 pr-1">
                  {data.transactions.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-xs italic">
                      No trades recorded yet
                    </div>
                  ) : (
                    data.transactions.map((tx) => {
                      const isBuy = tx.type === 'BUY';
                      return (
                        <div key={tx.id} className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold font-mono ${
                              isBuy ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                              {tx.type}
                            </span>
                            <div>
                              <span className="font-bold font-mono text-white">{tx.stock?.symbol || 'STOCK'}</span>
                              <span className="text-[10px] text-slate-400 ml-1.5">({tx.quantity} shrs @ {tx.price.toFixed(2)} IC)</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-slate-200">
                              {(tx.quantity * tx.price).toFixed(2)} IC
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {new Date(tx.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
}
