import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../services/api';
import { User, Lock, Mail, ArrowRight, Coins, Shield, Sun, Moon } from 'lucide-react';

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
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Secret 5-click trigger handler on the header badge icon
  const handleSecretTriggerClick = () => {
    const nextCount = clickCount + 1;
    setClickCount(nextCount);

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      setClickCount(0);
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

  // Dedicated Hardened Admin Login submit
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
    <div className="min-h-screen flex items-center justify-center p-4 theme-bg-main theme-text-main relative overflow-hidden transition-colors">
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="px-3 py-2 rounded-[4px] border theme-border theme-bg-card theme-bg-card-hover theme-text-main shadow-sm transition-all flex items-center gap-2 text-xs font-heading font-bold btn-terminal"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-[var(--accent)]" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span>Dark</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-md my-auto">
        <div className="text-center mb-8">
          
          <button
            type="button"
            onClick={handleSecretTriggerClick}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-[4px] theme-bg-card border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] text-[var(--accent)] text-xs font-mono font-bold mb-4 shadow-sm select-none active:scale-95 transition-all cursor-pointer"
            title="Ignite Coins Exchange"
          >
            <Coins className="w-4 h-4 text-[var(--accent)]" />
            <span>EQUITY ARENA (IC) EXCHANGE</span>
          </button>

          <h1 className="text-3xl font-extrabold tracking-tight theme-text-main font-heading uppercase">
            EQUITY ARENA
          </h1>
          <p className="theme-text-muted text-xs mt-2 font-medium">
            Trade 15 Indian stocks live with 20,000 IC starting cash
          </p>
        </div>

        <div className="theme-bg-card p-8 rounded-[6px] border theme-border transition-colors">
          
          <div className="flex theme-bg-panel p-1 rounded-[4px] mb-6 border theme-border">
            <button
              type="button"
              onClick={() => { setActiveTab('TRADER_SIGNIN'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold font-heading uppercase rounded-[3px] transition-all min-h-[38px] ${
                activeTab === 'TRADER_SIGNIN' ? 'bg-[var(--accent)] text-slate-950 shadow-sm' : 'theme-text-muted hover:theme-text-main'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('TRADER_REGISTER'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold font-heading uppercase rounded-[3px] transition-all min-h-[38px] ${
                activeTab === 'TRADER_REGISTER' ? 'bg-[var(--accent)] text-slate-950 shadow-sm' : 'theme-text-muted hover:theme-text-main'
              }`}
            >
              Create Account
            </button>

            {isAdminUnlocked && (
              <button
                type="button"
                onClick={() => { setActiveTab('ADMIN'); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold font-heading uppercase rounded-[3px] transition-all flex items-center justify-center gap-1 min-h-[38px] ${
                  activeTab === 'ADMIN' ? 'bg-[var(--accent)] text-slate-950 shadow-sm' : 'theme-text-muted hover:theme-text-main'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[color-mix(in_srgb,var(--loss-red)_10%,transparent)] border border-[color-mix(in_srgb,var(--loss-red)_30%,transparent)] rounded-[4px] text-[var(--loss-red)] text-xs font-mono">
              {error}
            </div>
          )}

          {activeTab !== 'ADMIN' && (
            <form onSubmit={handleTraderSubmit} className="space-y-4">
              {activeTab === 'TRADER_REGISTER' && (
                <div>
                  <label className="block text-xs font-semibold theme-text-muted mb-1 font-heading">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 theme-text-dim" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full theme-bg-panel border theme-border rounded-[4px] py-2 pl-10 pr-4 text-sm theme-text-main focus:outline-none focus:border-[var(--accent)] transition-all placeholder:theme-text-dim min-h-[40px] font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold theme-text-muted mb-1 font-heading">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 theme-text-dim" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full theme-bg-panel border theme-border rounded-[4px] py-2 pl-10 pr-4 text-sm theme-text-main focus:outline-none focus:border-[var(--accent)] transition-all placeholder:theme-text-dim min-h-[40px] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold theme-text-muted mb-1 font-heading">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 theme-text-dim" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full theme-bg-panel border theme-border rounded-[4px] py-2 pl-10 pr-4 text-sm theme-text-main focus:outline-none focus:border-[var(--accent)] transition-all placeholder:theme-text-dim min-h-[40px] font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_90%,transparent)] text-slate-950 font-extrabold text-xs font-mono uppercase tracking-wider rounded-[4px] shadow flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 mt-6 min-h-[44px] btn-terminal"
              >
                {loading ? 'LOGGING IN...' : (
                  <>
                    <span>{activeTab === 'TRADER_REGISTER' ? 'START TRADING (20,000 IC CASH)' : 'LOG IN'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'ADMIN' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold theme-text-muted mb-1 font-heading">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 theme-text-dim" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@test.com"
                    className="w-full theme-bg-panel border theme-border rounded-[4px] py-2 pl-10 pr-4 text-sm theme-text-main focus:outline-none focus:border-[var(--accent)] font-mono min-h-[40px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold theme-text-muted mb-1 font-heading">Admin Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 theme-text-dim" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full theme-bg-panel border theme-border rounded-[4px] py-2 pl-10 pr-4 text-sm theme-text-main focus:outline-none focus:border-[var(--accent)] font-mono min-h-[40px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_90%,transparent)] text-slate-950 font-extrabold text-xs font-mono uppercase tracking-wider rounded-[4px] shadow flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 mt-6 min-h-[44px] btn-terminal"
              >
                {loading ? 'LOGGING IN...' : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>ADMIN LOG IN</span>
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
