import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Pill, ShieldCheck, UserCheck, ArrowRight, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('satyam@pharmacy.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role) => {
    if (role === 'admin') {
      setEmail('satyam@pharmacy.com');
      setPassword('admin123');
    } else {
      setEmail('pharmacist@pharmacy.com');
      setPassword('pharma123');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl border border-slate-800 bg-white/95 p-8 shadow-2xl backdrop-blur-xl">
          {/* Logo & Header */}
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-500/30">
              <Pill className="h-8 w-8 transform -rotate-45" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
              PharmaCare<span className="text-teal-600">Pro</span>
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Full-Stack Pharmacy & Inventory Management System
            </p>
          </div>

          {/* Student Info Callout */}
          <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50/60 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-teal-900">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Full-Stack Web Development Assignment</span>
            </div>
            <p className="mt-1 text-[11px] text-teal-800">
              Created by <span className="font-bold">Satyam Kumar</span> &bull; Reg No: <span className="font-mono font-bold">12314877</span>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@pharmacy.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-700/20 hover:from-teal-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:opacity-70 transition-all cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Quick Demo Logins for Viva/Testing */}
          <div className="mt-6 border-t border-slate-200 pt-4">
            <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              1-Click Demo Accounts (Viva Demo)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-800 transition"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                <span>Admin Login</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('pharmacist')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition"
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Pharmacist</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

