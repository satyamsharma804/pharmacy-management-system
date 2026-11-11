import React, { useState, useEffect } from 'react';
import { apiRequest, formatCurrency, formatDate } from '../utils/api';
import { Search, Eye, Receipt, User, ShieldCheck } from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal';

export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const loadSales = async () => {
    setLoading(true);
    try {
      let query = `?search=${encodeURIComponent(search)}`;
      if (paymentMethod !== 'All') query += `&payment_method=${encodeURIComponent(paymentMethod)}`;
      const data = await apiRequest(`/sales${query}`);
      setSales(data);
    } catch (err) {
      console.error('Failed to load sales history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [search, paymentMethod]);

  const viewInvoice = async (saleId) => {
    try {
      const full = await apiRequest(`/sales/${saleId}`);
      setSelectedInvoice(full);
    } catch (err) {
      alert(err.message || 'Failed to fetch invoice details');
    }
  };

  const totalSalesAmount = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header and Summary */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Sales Transactions & Billing Records
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Audit trail of all processed customer bills, cashiers/pharmacists who billed them, and payment records
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
          <span className="text-slate-500 dark:text-slate-400">Filtered Sales:</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{sales.length} Bills</span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-slate-500 dark:text-slate-400">Total Volume:</span>
          <span className="font-black text-teal-700 dark:text-teal-400">{formatCurrency(totalSalesAmount)}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice number, customer name, cashier, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
          >
            <option value="All">All Payment Modes</option>
            <option value="UPI">UPI / QR</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
          </select>
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Invoice No</th>
                <th className="py-3 px-4 font-semibold">Date & Time</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Billed By (Cashier / Pharmacist)</th>
                <th className="py-3 px-4 font-semibold text-center">Items</th>
                <th className="py-3 px-4 font-semibold">Payment Mode</th>
                <th className="py-3 px-4 font-semibold text-right">Grand Total</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
                    <p className="mt-2 text-xs">Loading billing records...</p>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Receipt className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No sales transactions found</p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const dateVal = sale.createdAt || sale.created_at || sale.date;
                  const cashierName = sale.pharmacist_name || 'Satyam Kumar';
                  const itemCount = (sale.items && sale.items.length) || sale.total_items || 1;

                  return (
                    <tr key={sale.id || sale._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-teal-700 dark:text-teal-400">{sale.invoice_number}</span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <span className="font-medium">{formatDate(dateVal)}</span>
                        <span className="block text-[10px] text-slate-400">
                          {dateVal ? new Date(dateVal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{sale.customer_name || 'Walk-in'}</div>
                        {sale.customer_phone && (
                          <div className="text-[10px] text-slate-400">{sale.customer_phone}</div>
                        )}
                      </td>

                      {/* Cashier / Pharmacist Name Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold text-xs shadow-sm">
                            {cashierName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {cashierName}
                            </div>
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-teal-600 dark:text-teal-400">
                              <ShieldCheck className="h-2.5 w-2.5" />
                              <span>Cashier / Pharmacist</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {itemCount}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                          sale.payment_method === 'UPI'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : sale.payment_method === 'Cash'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {sale.payment_method}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(sale.total_amount)}</span>
                        {sale.discount_percentage > 0 && (
                          <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">-{sale.discount_percentage}% off</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => viewInvoice(sale.id || sale._id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-300 hover:border-teal-200 transition cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View / Print</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal for re-printing or inspecting */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
