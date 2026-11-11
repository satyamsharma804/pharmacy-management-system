import React, { useState, useEffect } from 'react';
import { apiRequest, formatCurrency, formatDate } from '../utils/api';
import { 
  DollarSign, 
  Package, 
  AlertTriangle, 
  Clock, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Plus, 
  ArrowUpRight,
  Eye
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import InvoiceModal from '../components/InvoiceModal';

export default function Dashboard({ setCurrentTab, onSelectInvoice }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchStats = async () => {
    try {
      const stats = await apiRequest('/dashboard/stats');
      setData(stats);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const openInvoiceDetails = async (invoiceId) => {
    try {
      const full = await apiRequest(`/sales/${invoiceId}`);
      setSelectedInvoice(full);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  const revenue = data?.revenue || { total: 0, today: 0, today_orders: 0 };
  const inventory = data?.inventory || { total_medicines: 0, total_units: 0, low_stock_count: 0, expiring_soon_count: 0 };
  const counts = data?.counts || { customers: 0, suppliers: 0 };
  const chartData = data?.sales_chart || [];
  const recentSales = data?.recent_sales || [];
  const alerts = data?.alerts || { low_stock: [], expiring_soon: [] };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Pharmacy Dashboard</h1>
          <p className="text-xs text-slate-500">Live operational overview, inventory alerts, and sales performance</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentTab('pos')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-700/20 hover:from-teal-700 hover:to-teal-800 transition"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Launch POS Billing</span>
          </button>
          <button
            onClick={() => setCurrentTab('inventory')}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <Plus className="h-4 w-4 text-teal-600" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Revenue</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">{formatCurrency(revenue.total)}</p>
          <p className="mt-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Today: {formatCurrency(revenue.today)} ({revenue.today_orders} bills)</span>
          </p>
        </div>

        {/* Medicines In Stock */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Medicines in Stock</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">{inventory.total_medicines} Items</p>
          <p className="mt-1 text-xs text-slate-500">
            Total Inventory Units: <strong className="text-slate-800">{inventory.total_units}</strong>
          </p>
        </div>

        {/* Low Stock Alert */}
        <div 
          onClick={() => setCurrentTab('inventory')}
          className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm cursor-pointer hover:bg-amber-50 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Low Stock Alert</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-amber-900">{inventory.low_stock_count} Items</p>
          <p className="mt-1 text-xs text-amber-700 font-medium flex items-center justify-between">
            <span>Needs immediate reorder</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </p>
        </div>

        {/* Expiring Soon */}
        <div 
          onClick={() => setCurrentTab('inventory')}
          className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm cursor-pointer hover:bg-rose-50 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">Expiring Soon</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-rose-900">{inventory.expiring_soon_count} Items</p>
          <p className="mt-1 text-xs text-rose-700 font-medium flex items-center justify-between">
            <span>Expiring within 30 days</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </p>
        </div>
      </div>

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Revenue Trend Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Revenue Analytics (Last 7 Days)</h2>
              <p className="text-xs text-slate-500">Daily sales transactions and revenue trends</p>
            </div>
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
              Live Feed
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Top Medicine Categories</h2>
            <p className="text-xs text-slate-500 mb-4">Inventory distribution by therapeutic class</p>
            <div className="space-y-3">
              {data?.category_stats?.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{cat.category}</span>
                    <span className="text-slate-500">{cat.count} items ({cat.total_stock} pcs)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-teal-600 rounded-full"
                      style={{ width: `${Math.min(100, (cat.count / (inventory.total_medicines || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => setCurrentTab('inventory')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
            >
              Browse Complete Inventory &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Urgent Alerts and Recent Transactions Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Critical Inventory Attention */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>Urgent Stock Warnings</span>
            </h2>
            <button
              onClick={() => setCurrentTab('inventory')}
              className="text-xs font-semibold text-teal-600 hover:underline"
            >
              Manage
            </button>
          </div>

          <div className="space-y-2.5">
            {alerts.low_stock.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-amber-50/60 p-3 border border-amber-200/70">
                <div>
                  <p className="text-xs font-bold text-slate-900">{item.name}</p>
                  <p className="text-[11px] text-amber-800">Batch: {item.batch_number} &bull; Shelf: {item.location_shelf || 'General'}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                    {item.quantity} units left
                  </span>
                  <p className="text-[10px] text-amber-700">Min threshold: {item.min_stock_level}</p>
                </div>
              </div>
            ))}

            {alerts.expiring_soon.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-rose-50/60 p-3 border border-rose-200/70">
                <div>
                  <p className="text-xs font-bold text-slate-900">{item.name}</p>
                  <p className="text-[11px] text-rose-800">Batch: {item.batch_number} &bull; Shelf: {item.location_shelf || 'General'}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-lg bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-900">
                    Exp: {item.expiry_date}
                  </span>
                  <p className="text-[10px] text-rose-700">{item.quantity} units in stock</p>
                </div>
              </div>
            ))}

            {alerts.low_stock.length === 0 && alerts.expiring_soon.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">All inventory items are in good health!</p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
            <button
              onClick={() => setCurrentTab('sales')}
              className="text-xs font-semibold text-teal-600 hover:underline"
            >
              View All Bills
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-slate-800">{sale.invoice_number}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600 uppercase">
                      {sale.payment_method}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {sale.customer_name} &bull; Cashier: <strong className="text-slate-700 font-semibold">{sale.pharmacist_name || 'Satyam Kumar'}</strong> &bull; {sale.items_count} items
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-900">{formatCurrency(sale.total_amount)}</span>
                  <button
                    onClick={() => openInvoiceDetails(sale.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition"
                    title="View Receipt"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}
    </div>
  );
}

