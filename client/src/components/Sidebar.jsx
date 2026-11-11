import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Pill, 
  Receipt, 
  Users, 
  Truck, 
  BarChart3,
  Sparkles,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentTab, setCurrentTab }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const menuItems = isAdmin ? [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS Billing', icon: ShoppingCart, highlight: true },
    { id: 'inventory', label: 'Inventory', icon: Pill },
    { id: 'sales', label: 'Sales History', icon: Receipt },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'staff', label: 'Cashiers & Staff', icon: UserCheck },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ] : [
    { id: 'pos', label: 'POS Billing', icon: ShoppingCart, highlight: true },
    { id: 'inventory', label: 'Inventory (Add / View)', icon: Pill },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'sales', label: 'Sales History', icon: Receipt },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)] transition-colors">
      <div>
        <div className="mb-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {isAdmin ? (
              <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            ) : (
              <UserCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            )}
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              {isAdmin ? 'Admin View' : 'Cashier View'}
            </span>
          </div>
          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
            isAdmin ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
          }`}>
            {user?.role || 'cashier'}
          </span>
        </div>

        <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Navigation
        </div>
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-700/20'
                    : item.highlight
                    ? 'text-teal-700 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/40 hover:bg-teal-100/60 dark:hover:bg-teal-900/50 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : item.highlight ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="ml-auto rounded-full bg-teal-200/70 dark:bg-teal-900/70 px-1.5 py-0.5 text-[10px] text-teal-800 dark:text-teal-200 font-bold">
                    POS
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Student / Academic Info Card */}
      <div className="mt-8 rounded-2xl border border-teal-100 dark:border-teal-900/40 bg-gradient-to-b from-teal-50/70 to-emerald-50/50 dark:from-slate-800/80 dark:to-teal-950/40 p-4 transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-teal-900 dark:text-teal-300">Academic Project</span>
        </div>
        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
          Course: <strong className="text-slate-800 dark:text-slate-200">Full-Stack Web Dev</strong>
        </p>
        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
          Student: <strong className="text-slate-800 dark:text-slate-200">Satyam Kumar</strong>
        </p>
        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
          Roll No: <strong className="text-teal-700 dark:text-teal-400 font-mono">12314877</strong>
        </p>
        <div className="mt-3 border-t border-teal-200/50 dark:border-slate-700/60 pt-2 text-[10px] text-teal-800/80 dark:text-teal-300/80 font-medium text-center">
          Pharmacy Management System
        </div>
      </div>
    </aside>
  );
}
