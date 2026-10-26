import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, Sparkles, Lock, Mail, User as UserIcon, Phone, AlertCircle } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState<boolean>(false);

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        await register(email, password, fullName, phone);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = async () => {
    setEmail('demo@smartspend.ai');
    setPassword('Password123!');
    setLoading(true);
    setError(null);
    try {
      await login('demo@smartspend.ai', 'Password123!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to login with demo credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-[#070A11] text-white selection:bg-emerald-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/[0.08] rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/[0.07] rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#0D131F]/90 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl shadow-black/80 relative z-10">
        {/* Branding */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-600 flex items-center justify-center text-slate-950 mx-auto shadow-xl shadow-emerald-500/25 mb-3 font-bold">
            <Wallet className="w-7 h-7 text-slate-950" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">SmartSpend</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <Sparkles className="w-3 h-3 mr-1 text-emerald-400" /> AI
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Personal Finance Assistant for India (₹ INR, UPI & Analytics)
          </p>
        </div>

        {/* Quick Demo Login Pill */}
        <div className="mb-6">
          <button
            type="button"
            onClick={fillDemoAccount}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Click for Instant Demo Login (Aarav's Account)</span>
          </button>
        </div>

        {/* Tab Switch */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-white/5 border border-white/10 mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              !isRegister ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              isRegister ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-xs text-red-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Aarav Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={isRegister}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mobile Number (Optional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Create Free Account' : 'Sign In to SmartSpend'}
          </button>
        </form>

        {/* Security disclaimer */}
        <p className="mt-6 text-[11px] text-center text-slate-400">
          🔒 Zero UPI PIN / Bank credential storage • DPDP Act 2023 compliant
        </p>
      </div>
    </div>
  );
};
