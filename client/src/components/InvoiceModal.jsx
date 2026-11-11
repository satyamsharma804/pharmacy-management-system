import React from 'react';
import { Printer, X, CheckCircle, Pill } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/api';

export default function InvoiceModal({ invoice, onClose }) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden my-8">
        {/* Top actions bar (hidden in print) */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3 no-print">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Sale Completed Successfully</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-teal-700 transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div id="printable-receipt" className="p-8 font-sans text-slate-800">
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-300 pb-4">
            <div className="inline-flex items-center justify-center gap-2 mb-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700 text-white">
                <Pill className="h-4 w-4" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900">PHARMACARE DISPENSARY</h2>
            </div>
            <p className="text-xs text-slate-500">Licensed Drug Store & Healthcare Services</p>
            <p className="text-xs text-slate-500">DL No: DL-2026/PH-8891 | GSTIN: 07AAAAA0000A1Z5</p>
            <p className="text-xs text-slate-500">Phone: +91 98765 43210 | Main Health Complex, Delhi</p>
          </div>

          {/* Invoice Info */}
          <div className="mt-4 flex justify-between text-xs text-slate-600 pb-2 border-b border-slate-100">
            <div>
              <p><span className="text-slate-400">Invoice:</span> <strong className="font-mono text-slate-800">{invoice.invoice_number}</strong></p>
              <p><span className="text-slate-400">Customer:</span> <strong className="text-slate-800">{invoice.customer_name || 'Walk-in Customer'}</strong></p>
              {invoice.customer_phone && <p><span className="text-slate-400">Phone:</span> {invoice.customer_phone}</p>}
            </div>
            <div className="text-right">
              <p><span className="text-slate-400">Date:</span> {formatDate(invoice.created_at || new Date())}</p>
              <p><span className="text-slate-400">Payment:</span> <span className="font-semibold text-teal-700 uppercase">{invoice.payment_method || 'Cash'}</span></p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mt-4 text-xs">
            <thead>
              <tr className="border-b border-slate-300 text-slate-500">
                <th className="py-2 text-left font-semibold">Medicine / Batch</th>
                <th className="py-2 text-center font-semibold">Qty</th>
                <th className="py-2 text-right font-semibold">Rate</th>
                <th className="py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items?.map((item, idx) => (
                <tr key={idx} className="text-slate-800">
                  <td className="py-2">
                    <p className="font-semibold">{item.medicine_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">B.No: {item.batch_number || 'GEN'}</p>
                  </td>
                  <td className="py-2 text-center font-medium">{item.quantity}</td>
                  <td className="py-2 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                  <td className="py-2 text-right font-semibold">{formatCurrency(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-4 border-t border-dashed border-slate-300 pt-3 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount_percentage > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount ({invoice.discount_percentage}%):</span>
                <span>-{formatCurrency(invoice.subtotal * (invoice.discount_percentage / 100))}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>GST / Tax ({invoice.tax_percentage || 5}%):</span>
              <span>+{formatCurrency((invoice.subtotal * (1 - (invoice.discount_percentage || 0) / 100)) * ((invoice.tax_percentage || 5) / 100))}</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold text-slate-900">
              <span>Grand Total:</span>
              <span className="text-teal-700">{formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-6 border-t border-slate-100 pt-3 text-center text-[10px] text-slate-400 space-y-1">
            <p>Thank you for choosing PharmaCare Pro!</p>
            <p>Get well soon. Store medicines below 25°C away from direct sunlight.</p>
            <p className="italic font-mono text-[9px]">Developed by Satyam Kumar (12314877) - Full-Stack Web Dev</p>
          </div>
        </div>

        {/* Modal Bottom Close (hidden in print) */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 text-right no-print">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
}

