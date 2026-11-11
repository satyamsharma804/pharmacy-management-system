import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POSBilling from './pages/POSBilling';
import Inventory from './pages/Inventory';
import SalesHistory from './pages/SalesHistory';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import StaffManagement from './pages/StaffManagement';

function MainApp() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [currentTab, setCurrentTab] = useState('pos');

  // Set default tab on initial load or user change
  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        setCurrentTab('dashboard');
      } else {
        setCurrentTab('pos');
      }
    }
  }, [user?.role]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
          <p className="mt-4 text-sm font-semibold text-slate-300">Loading PharmaCare Pro...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    // If not admin and trying to access an admin-only tab, default to POS
    if (!isAdmin && ['dashboard', 'staff', 'suppliers', 'reports'].includes(currentTab)) {
      return <POSBilling />;
    }

    switch (currentTab) {
      case 'dashboard':
        return <Dashboard setCurrentTab={setCurrentTab} />;
      case 'pos':
        return <POSBilling />;
      case 'inventory':
        return <Inventory />;
      case 'sales':
        return <SalesHistory />;
      case 'customers':
        return <Customers />;
      case 'staff':
        return <StaffManagement />;
      case 'suppliers':
        return <Suppliers />;
      case 'reports':
        return <Reports />;
      default:
        return isAdmin ? <Dashboard setCurrentTab={setCurrentTab} /> : <POSBilling />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar onNavigateAlerts={() => setCurrentTab('inventory')} />

      {/* Main Container */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        {/* Content Area */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderContent()}
        </main>
      </div>

      {/* Persistent Academic Project Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-6 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 transition-colors">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 dark:text-slate-200">PharmaCare Pro</span>
          <span>&bull;</span>
          <span>Pharmacy & Inventory Management System</span>
        </div>
        <div>
          <span>Academic Assignment for <strong>Full-Stack Web Development</strong></span>
          <span className="mx-2">&bull;</span>
          <span>Student: <strong className="text-slate-900 dark:text-slate-200">Satyam Kumar</strong> (Reg: <strong className="font-mono text-teal-600 dark:text-teal-400">12314877</strong>)</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
