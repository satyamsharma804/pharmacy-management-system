import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { 
  Bell, 
  LogOut, 
  User, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Pill,
  Sparkles
} from 'lucide-react';

export default function Navbar({ onNavigateAlerts }) {
  const { user, logout } = useAuth();
  const [alerts, setAlerts] = useState({ low_stock: [], expiring_soon: [], total_alerts: 0 });
  const [showAlertMenu, setShowAlertMenu] = useState(false);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const data = await apiRequest('/medicines/alerts/summary');
        setAlerts(data);
      } catch (err) {
        console.error('Failed to load alert counts:', err);
      }
    }
    loadAlerts();
    const interval = setInterval(loadAlerts, 20000); // refresh every 20s
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur-md">
      {/* Left: Project title & Student info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-md shadow-teal-500/20">
            <Pill className="h-6 w-6 transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">PharmaCare<span className="text-teal-600">Pro</span></span>
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700 border border-teal-200">v1.0</span>
            </div>
            <p className="text-xs text-slate-500">Pharmacy & Inventory Management</p>
          </div>
        </div>

        {/* Student Assignment Badge */}
        <div className="hidden lg:flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-700 border border-slate-200/80">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Assignment: <strong>Full-Stack Web Dev</strong></span>
          <span className="text-slate-300">|</span>
          <span>By: <strong className="text-slate-900">Satyam Kumar</strong></span>
          <span className="rounded bg-teal-100 text-teal-800 font-mono px-1.5 py-0.2 text-[11px] font-semibold">12314877</span>
        </div>
      </div>

      {/* Right: Notifications & User profile */}
      <div className="flex items-center gap-3">
        {/* Alerts Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAlertMenu(!showAlertMenu)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="System Alerts"
          >
            <Bell className="h-4 w-4" />
            {alerts.total_alerts > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
                {alerts.total_alerts}
              </span>
            )}
          </button>

          {showAlertMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-semibold text-sm text-slate-800">Inventory Alerts</span>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                  {alerts.total_alerts} Active
                </span>
              </div>

              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {alerts.low_stock.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 mb-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Low Stock ({alerts.low_stock.length})
                    </p>
                    {alerts.low_stock.slice(0, 3).map((item) => (
                      <div key={`low-${item.id}`} className="rounded bg-amber-50 p-1.5 text-xs text-amber-900 mb-1">
                        <strong>{item.name}</strong> - Only {item.quantity} left (Min: {item.min_stock_level})
                      </div>
                    ))}
                  </div>
                )}

                {alerts.expiring_soon.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 mb-1">
                      <Clock className="h-3.5 w-3.5" /> Expiring Soon ({alerts.expiring_soon.length})
                    </p>
                    {alerts.expiring_soon.slice(0, 3).map((item) => (
                      <div key={`exp-${item.id}`} className="rounded bg-rose-50 p-1.5 text-xs text-rose-900 mb-1">
                        <strong>{item.name}</strong> - Expiry: {item.expiry_date}
                      </div>
                    ))}
                  </div>
                )}

                {alerts.total_alerts === 0 && (
                  <p className="py-4 text-center text-xs text-slate-400">All inventory stock levels are healthy.</p>
                )}
              </div>

              <div className="mt-2 border-t border-slate-100 pt-2 text-center">
                <button
                  onClick={() => {
                    setShowAlertMenu(false);
                    if (onNavigateAlerts) onNavigateAlerts();
                  }}
                  className="text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline"
                >
                  View in Inventory &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white font-semibold text-xs">
            {user?.name ? user.name[0] : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name || 'Pharmacist'}</p>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <ShieldCheck className="h-3 w-3 text-teal-600" />
              <span className="capitalize">{user?.role || 'Staff'}</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors"
          title="Sign Out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

