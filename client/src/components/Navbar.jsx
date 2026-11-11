import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiRequest } from '../utils/api';
import { 
  Bell, 
  LogOut, 
  User, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Pill,
  Sun,
  Moon
} from 'lucide-react';

export default function Navbar({ onNavigateAlerts }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [alerts, setAlerts] = useState({ low_stock: [], expiring_soon: [], total_alerts: 0 });
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const alertRef = useRef(null);

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

  // Close dropdown when clicking anywhere outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (alertRef.current && !alertRef.current.contains(event.target)) {
        setShowAlertMenu(false);
      }
    }

    if (showAlertMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAlertMenu]);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-6 backdrop-blur-md transition-colors">
      {/* Left: Project title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-md shadow-teal-500/20">
            <Pill className="h-6 w-6 transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">PharmaCare<span className="text-teal-600 dark:text-teal-400">Pro</span></span>
              <span className="rounded-full bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 text-[10px] font-semibold text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">v1.0</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pharmacy & Inventory Management</p>
          </div>
        </div>
      </div>

      {/* Right: Theme Toggle, Notifications & User profile */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400 animate-pulse" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600" />
          )}
        </button>

        {/* Alerts Bell Dropdown with Click-Outside Detector */}
        <div ref={alertRef} className="relative">
          <button
            onClick={() => setShowAlertMenu(!showAlertMenu)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
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
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-2xl z-50 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Inventory Alerts</span>
                <span className="rounded-full bg-rose-100 dark:bg-rose-950/70 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
                  {alerts.total_alerts} Active
                </span>
              </div>

              <div className="mt-2.5 space-y-2 max-h-64 overflow-y-auto">
                {alerts.low_stock.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Low Stock ({alerts.low_stock.length})
                    </p>
                    {alerts.low_stock.slice(0, 3).map((item) => (
                      <div key={`low-${item.id || item._id}`} className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-2 text-xs text-amber-900 dark:text-amber-200 mb-1 border border-amber-200/50 dark:border-amber-800/40">
                        <strong>{item.name}</strong> - Only {item.quantity} left (Min: {item.min_stock_level})
                      </div>
                    ))}
                  </div>
                )}

                {alerts.expiring_soon.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1">
                      <Clock className="h-3.5 w-3.5" /> Expiring Soon ({alerts.expiring_soon.length})
                    </p>
                    {alerts.expiring_soon.slice(0, 3).map((item) => (
                      <div key={`exp-${item.id || item._id}`} className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-2 text-xs text-rose-900 dark:text-rose-200 mb-1 border border-rose-200/50 dark:border-rose-800/40">
                        <strong>{item.name}</strong> - Expiry: {item.expiry_date}
                      </div>
                    ))}
                  </div>
                )}

                {alerts.total_alerts === 0 && (
                  <p className="py-4 text-center text-xs text-slate-400">All inventory stock levels are healthy.</p>
                )}
              </div>

              <div className="mt-2.5 border-t border-slate-100 dark:border-slate-800 pt-2 text-center">
                <button
                  onClick={() => {
                    setShowAlertMenu(false);
                    if (onNavigateAlerts) onNavigateAlerts();
                  }}
                  className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
                >
                  View in Inventory &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 shadow-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white font-semibold text-xs shadow-sm">
            {user?.name ? user.name[0] : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{user?.name || 'Pharmacist'}</p>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-3 w-3 text-teal-600 dark:text-teal-400" />
              <span className="capitalize">{user?.role || 'Staff'}</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-3 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition shadow-sm"
          title="Sign Out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
