import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import type { SafeUser } from '../types/crm';
import { getDemoLoginAccounts, loginWithCredentials } from '../services/authService';

interface LoginScreenProps {
  onLoginSuccess: (user: SafeUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = getDemoLoginAccounts();
  const adminAccounts = demoAccounts.filter((u) => u.role === 'ADMIN');
  const managerAccounts = demoAccounts.filter((u) => u.role === 'MANAGER');
  const agentAccounts = demoAccounts.filter((u) => u.role === 'AGENT');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = loginWithCredentials(email, password);
    if (result.error || !result.user) {
      setError(result.error ?? 'Invalid email or password.');
      return;
    }
    onLoginSuccess(result.user);
  };

  const handleQuickDemoClick = (account: SafeUser) => {
    setError(null);
    setEmail(account.email);
    setPassword('Demo123!');
  };

  const isSelectedAccount = (account: SafeUser) =>
    email.trim().toLowerCase() === account.email.toLowerCase();

  return (
    <div className="min-h-screen workspace-ambient-canvas flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[960px] grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-view-enter">
        {/* Left column: Brand & Credential Sign-In */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-xl p-8 shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_1px_2px_-1px_rgba(15,23,42,0.02)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm shadow-indigo-500/25 flex items-center justify-center text-white font-bold text-sm tracking-tight shrink-0">
              NW
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#0f172a] tracking-tight leading-tight">
                NovaWorks Technologies
              </h1>
              <p className="text-xs text-[#64748b] font-medium">
                Enterprise Delivery &amp; Project CRM
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#0f172a] tracking-tight">
              Sign in to workspace
            </h2>
            <p className="text-sm text-[#475569] mt-1">
              Enter your NovaWorks credentials to access role-scoped projects and deliverables.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3.5 py-3 text-sm text-[#b91c1c]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold uppercase tracking-[0.04em] text-[#475569] mb-1.5"
              >
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@novaworks.example"
                  className="w-full h-10 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold uppercase tracking-[0.04em] text-[#475569] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full h-10 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-10 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-medium rounded-lg shadow-md shadow-indigo-500/25 transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-5 pt-4 border-t border-[#f1f5f9] text-xs text-[#64748b]">
            Demo password for all 10 pre-seeded accounts:{' '}
            <code className="font-mono text-[#0f172a] bg-[#f1f5f9] px-1.5 py-0.5 rounded">
              Demo123!
            </code>
          </p>
        </div>

        {/* Right column: Quick Demo Login Pills */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-xl p-8 shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_1px_2px_-1px_rgba(15,23,42,0.02)]">
          <div className="mb-5 pb-4 border-b border-[#f1f5f9]">
            <h2 className="text-base font-semibold text-[#0f172a]">
              Quick Demo Login
            </h2>
            <p className="text-xs text-[#64748b] mt-1">
              Click any NovaWorks account below to autofill its Work Email and Password, then click Sign In.
            </p>
          </div>

          <div className="space-y-5">
            {/* Admin */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#475569] mb-2">
                Administration
              </div>
              <div className="flex flex-wrap gap-2">
                {adminAccounts.map((acc) => {
                  const selected = isSelectedAccount(acc);
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleQuickDemoClick(acc)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap ${
                        selected
                          ? 'border-indigo-600 bg-indigo-100 text-indigo-900 ring-2 ring-indigo-500/25 shadow-xs'
                          : 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      <span className="font-mono text-[11px] font-semibold">{acc.id}</span>
                      <span>{acc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Managers */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#475569] mb-2">
                Project Managers
              </div>
              <div className="flex flex-wrap gap-2">
                {managerAccounts.map((acc) => {
                  const selected = isSelectedAccount(acc);
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleQuickDemoClick(acc)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap ${
                        selected
                          ? 'border-amber-500 bg-amber-100 text-amber-950 ring-2 ring-amber-500/25 shadow-xs'
                          : 'border-amber-200 bg-amber-50/70 hover:bg-amber-100 hover:border-amber-300 text-slate-800'
                      }`}
                    >
                      <span className="font-mono text-[11px] text-amber-700 font-semibold">
                        {acc.id}
                      </span>
                      <span>{acc.name}</span>
                      <span className="text-slate-500">· {acc.specialization}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Agents / Developers */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#475569] mb-2">
                Developers (Agents)
              </div>
              <div className="flex flex-wrap gap-2">
                {agentAccounts.map((acc) => {
                  const selected = isSelectedAccount(acc);
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleQuickDemoClick(acc)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap ${
                        selected
                          ? 'border-emerald-600 bg-emerald-100 text-emerald-950 ring-2 ring-emerald-500/25 shadow-xs'
                          : 'border-slate-200/80 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-800'
                      }`}
                    >
                      <span className="font-mono text-[11px] text-emerald-700 font-semibold">
                        {acc.id}
                      </span>
                      <span>{acc.name}</span>
                      <span className="text-slate-500">· {acc.specialization}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
