import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Pill, 
  Receipt, 
  Users, 
  Truck, 
  BarChart3,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS Billing', icon: ShoppingCart, highlight: true },
    { id: 'inventory', label: 'Inventory', icon: Pill },
    { id: 'sales', label: 'Sales History', icon: Receipt },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div>
        <div className="mb-4 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Main Menu
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
                    ? 'text-teal-700 bg-teal-50/70 hover:bg-teal-100/60 font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : item.highlight ? 'text-teal-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="ml-auto rounded-full bg-teal-200/70 px-1.5 py-0.5 text-[10px] text-teal-800">
                    POS
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Student / Academic Info Card */}
      <div className="mt-8 rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50/70 to-emerald-50/50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-teal-900">Academic Project</span>
        </div>
        <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
          Course: <strong className="text-slate-800">Full-Stack Web Dev</strong>
        </p>
        <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
          Student: <strong className="text-slate-800">Satyam Kumar</strong>
        </p>
        <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
          Roll No: <strong className="text-teal-700 font-mono">12314877</strong>
        </p>
        <div className="mt-3 border-t border-teal-200/50 pt-2 text-[10px] text-teal-800/80 font-medium text-center">
          Pharmacy Management System
        </div>
      </div>
    </aside>
  );
}

