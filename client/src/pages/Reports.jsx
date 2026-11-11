import React, { useState, useEffect } from 'react';
import { apiRequest, formatCurrency } from '../utils/api';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  ShieldCheck,
  PieChart as PieIcon,
  CheckCircle2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function Reports() {
  const [medicines, setMedicines] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meds, sls] = await Promise.all([
          apiRequest('/medicines'),
          apiRequest('/sales')
        ]);
        setMedicines(meds);
        setSales(sls);
      } catch (err) {
        console.error('Failed to load reports data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute Metrics
  const totalCostValue = medicines.reduce((sum, m) => sum + (m.purchase_price * m.quantity), 0);
  const totalRetailValue = medicines.reduce((sum, m) => sum + (m.selling_price * m.quantity), 0);
  const potentialProfit = totalRetailValue - totalCostValue;
  const marginPercent = totalRetailValue > 0 ? ((potentialProfit / totalRetailValue) * 100).toFixed(1) : 0;

  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0);

  // Category counts
  const categoryMap = {};
  medicines.forEach((m) => {
    categoryMap[m.category] = (categoryMap[m.category] || 0) + m.quantity;
  });
  const categoryChartData = Object.entries(categoryMap).map(([category, stock]) => ({
    category,
    stock
  }));

  const COLORS = ['#0d9488', '#0284c7', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  // CSV Export feature
  const exportInventoryCSV = () => {
    if (medicines.length === 0) return;
    
    const headers = [
      'ID', 'Name', 'Generic Name', 'Category', 'Batch Number', 
      'Location', 'Quantity', 'Purchase Price (INR)', 'Selling Price (INR)', 'Expiry Date'
    ];

    const rows = medicines.map(m => [
      m.id,
      `"${m.name.replace(/"/g, '""')}"`,
      `"${(m.generic_name || '').replace(/"/g, '""')}"`,
      `"${m.category}"`,
      m.batch_number,
      m.location_shelf || 'Main',
      m.quantity,
      m.purchase_price,
      m.selling_price,
      m.expiry_date
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pharmacy_inventory_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header and Export Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Inventory & Financial Reports</h1>
          <p className="text-xs text-slate-500">Valuation analysis, profit margins, stock auditing and CSV data export</p>
        </div>
        <button
          onClick={exportInventoryCSV}
          className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition"
        >
          <Download className="h-4 w-4" />
          <span>Export Inventory to CSV</span>
        </button>
      </div>

      {/* Financial Valuation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Inventory Cost Value</span>
          <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(totalCostValue)}</p>
          <p className="mt-1 text-[11px] text-slate-400">Total capital invested in current stock</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Estimated Retail Value</span>
          <p className="mt-2 text-2xl font-black text-teal-700">{formatCurrency(totalRetailValue)}</p>
          <p className="mt-1 text-[11px] text-slate-400">Projected value at current selling prices</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Projected Gross Margin</span>
          <p className="mt-2 text-2xl font-black text-emerald-600">{formatCurrency(potentialProfit)}</p>
          <p className="mt-1 text-[11px] text-emerald-600 font-bold">{marginPercent}% gross margin spread</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Total Realized Revenue</span>
          <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(totalSalesRevenue)}</p>
          <p className="mt-1 text-[11px] text-slate-400">{sales.length} customer invoices recorded</p>
        </div>
      </div>

      {/* Visual Chart: Stock by Category */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-1">Stock Quantities by Category</h2>
        <p className="text-xs text-slate-500 mb-4">Total pharmaceutical units available per therapeutic category</p>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                formatter={(val) => [`${val} Units`, 'In Stock']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="stock" radius={[6, 6, 0, 0]}>
                {categoryChartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inventory Health Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Inventory Health & Compliance Audit</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-800">Healthy Stock SKUs</p>
              <p className="text-lg font-black text-emerald-950">
                {medicines.filter((m) => m.quantity > m.min_stock_level).length} Items
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 p-4 border border-amber-100 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-800">Stockout Warning SKUs</p>
              <p className="text-lg font-black text-amber-950">
                {medicines.filter((m) => m.quantity <= m.min_stock_level).length} Items
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-rose-50 p-4 border border-rose-100 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-800">Expiring (&le;30 Days)</p>
              <p className="text-lg font-black text-rose-950">
                {medicines.filter((m) => new Date(m.expiry_date) <= new Date(Date.now() + 30 * 86400000)).length} Items
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
