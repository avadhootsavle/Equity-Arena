import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { User, Lock, Mail, ArrowRight, Coins, Shield } from 'lucide-react';

export function Login() {
  const [activeTab, setActiveTab] = useState('TRADER_SIGNIN'); // 'TRADER_SIGNIN', 'TRADER_REGISTER', 'ADMIN'
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const clickTimerRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Inconspicuous 5-click secret trigger handler on the header badge icon
  const handleSecretTriggerClick = () => {
    const nextCount = clickCount + 1;
    setClickCount(nextCount);

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      setClickCount(0); // Reset click counter after 3s of inactivity
    }, 3000);

    if (nextCount >= 5) {
      setIsAdminUnlocked(true);
      setActiveTab('ADMIN');
      setClickCount(0);
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    }
  };

  // Trader Sign In / Register submit
  const handleTraderSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const isRegister = activeTab === 'TRADER_REGISTER';
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister ? { name, email, password } : { email, password };
      
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      login(data.token, data.user);
      navigate('/trader');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Dedicated Hardened Admin Login submit (No quick shortcuts!)
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      login(data.token, data.user);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Admin authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#090d16] relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          
          {/* Secret 5-Click Inconspicuous Trigger on Header Badge */}
          <button
            type="button"
            onClick={handleSecretTriggerClick}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass-panel border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4 shadow-lg shadow-emerald-500/10 cursor-pointer select-none active:scale-95 transition-all"
            title="Ignite Coins Exchange"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span>EQUITY ARENA (IC) TRADER EXCHANGE</span>
          </button>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Real-Time Stock Exchange
          </h1>
          <p className="text-slate-400 text-xs mt-2">
            Trade 15 India sector stocks using Ignite Coins (20,000 IC starting balance)
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl shadow-2xl border border-slate-800">
          
          {/* Navigation Tabs */}
          <div className="flex bg-slate-900/80 p-1 rounded-xl mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => { setActiveTab('TRADER_SIGNIN'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'TRADER_SIGNIN' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('TRADER_REGISTER'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'TRADER_REGISTER' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>

            {/* Hidden Admin Tab (Only visible after 5-click secret trigger!) */}
            {isAdminUnlocked && (
              <button
                type="button"
                onClick={() => { setActiveTab('ADMIN'); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'ADMIN' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* TRADER SIGNIN & REGISTER FORM */}
          {activeTab !== 'ADMIN' && (
            <form onSubmit={handleTraderSubmit} className="space-y-4">
              {activeTab === 'TRADER_REGISTER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Trader Name"
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trader@example.com"
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 mt-6"
              >
                {loading ? 'Processing...' : (
                  <>
                    <span>{activeTab === 'TRADER_REGISTER' ? 'Create Trader Account (20,000 IC)' : 'Sign In to Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* UNLOCKED ADMIN CONSOLE FORM (Requires real credential entry, no quick shortcuts!) */}
          {activeTab === 'ADMIN' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@test.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 mt-6"
              >
                {loading ? 'Authenticating...' : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>AUTHORIZE HOST CONSOLE</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
