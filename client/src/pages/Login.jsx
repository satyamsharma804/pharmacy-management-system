import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Pill, ShieldCheck, UserCheck, ArrowRight, Lock, Mail, Phone, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' or 'signup'

  // Login form state
  const [email, setEmail] = useState('satyam@pharmacy.com');
  const [password, setPassword] = useState('admin123');

  // Signup form state
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('cashier'); // 'cashier' or 'admin'

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await register({
        name,
        email: signupEmail,
        phone: signupPhone,
        password: signupPassword,
        role: signupRole
      });
      // Context register automatically logs the user in
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role) => {
    setMode('login');
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
        <div className="rounded-3xl border border-slate-800 bg-white/95 dark:bg-slate-900/95 p-8 shadow-2xl backdrop-blur-xl">
          {/* Logo & Header */}
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-500/30">
              <Pill className="h-8 w-8 transform -rotate-45" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              PharmaCare<span className="text-teal-600 dark:text-teal-400">Pro</span>
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Professional Pharmacy, Billing & Inventory Management System
            </p>
          </div>

          {/* Tab Selector: Sign In vs Sign Up */}
          <div className="mt-6 flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 rounded-xl py-2 transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`flex-1 rounded-xl py-2 transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Pharmacist / Cashier Sign Up
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
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
          )}

          {/* SIGN UP FORM (NEW PHARMACIST / CASHIER) */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="mt-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 py-2 pl-9 pr-3 text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="ramesh@pharmacy.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 py-2 pl-9 pr-3 text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+91 98111 22334"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 py-2 pl-9 pr-3 text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Choose password (min. 4 characters)"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 py-2 pl-9 pr-3 text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Register As Role
                </label>
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 py-2 px-3 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none transition"
                >
                  <option value="cashier">Cashier / Pharmacist (POS Billing & Medicine Management)</option>
                  <option value="admin">Administrator (Full Store & Staff Access)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 py-2.5 text-xs font-bold text-white shadow-lg shadow-teal-700/20 hover:from-teal-700 hover:to-teal-800 focus:outline-none disabled:opacity-70 transition-all cursor-pointer"
              >
                <span>{loading ? 'Creating Account...' : 'Register & Start Billing'}</span>
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          )}

          {/* Quick Demo Logins for Viva/Testing */}
          <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4">
            <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
              1-Click Demo Accounts (Viva Demo)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:border-teal-300 hover:text-teal-800 transition cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                <span>Admin Login</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('pharmacist')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 hover:text-emerald-800 transition cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Cashier Login</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
