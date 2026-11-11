import React, { useState } from 'react';
import { Printer, X, CheckCircle, Pill, Tag, ShieldCheck, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/api';

export default function InvoiceModal({ invoice, onClose }) {
  const [paperStyle, setPaperStyle] = useState('dmart'); // 'dmart' thermal style or 'standard'

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  // Group items by GST bracket (0%, 5%, 12%, 18%)
  const items = invoice.items || [];
  const groupedByGst = items.reduce((acc, item) => {
    const rate = Number(item.gst_rate !== undefined ? item.gst_rate : (invoice.tax_percentage || 5));
    if (!acc[rate]) acc[rate] = [];
    acc[rate].push(item);
    return acc;
  }, {});

  // Sorted GST slabs
  const gstSlabs = Object.keys(groupedByGst).map(Number).sort((a, b) => a - b);

  // Total items and quantity
  const totalItems = items.length;
  const totalQty = items.reduce((sum, it) => sum + Number(it.quantity || 1), 0);

  // Compute or read GST Breakup Table
  let gstBreakup = invoice.gst_breakup;
  if (!gstBreakup || gstBreakup.length === 0) {
    gstBreakup = gstSlabs.map((rate) => {
      const slabItems = groupedByGst[rate] || [];
      const taxable = slabItems.reduce((sum, it) => sum + (it.taxable_amount || it.total_price || (it.unit_price * it.quantity)), 0);
      const halfRate = rate / 2;
      const cgst = parseFloat((taxable * (halfRate / 100)).toFixed(2));
      const sgst = parseFloat((taxable * (halfRate / 100)).toFixed(2));
      const totalTax = parseFloat((cgst + sgst).toFixed(2));
      return {
        gst_rate: rate,
        taxable_amount: parseFloat(taxable.toFixed(2)),
        cgst_rate: halfRate,
        cgst_amount: cgst,
        sgst_rate: halfRate,
        sgst_amount: sgst,
        total_tax: totalTax,
        total_amount: parseFloat((taxable + totalTax).toFixed(2))
      };
    });
  }

  const totalTaxable = gstBreakup.reduce((sum, b) => sum + Number(b.taxable_amount || 0), 0);
  const totalCgst = gstBreakup.reduce((sum, b) => sum + Number(b.cgst_amount || 0), 0);
  const totalSgst = gstBreakup.reduce((sum, b) => sum + Number(b.sgst_amount || 0), 0);
  const totalTaxAll = totalCgst + totalSgst;

  // Savings on MRP calculation
  const totalSavings = invoice.total_savings || 
    (invoice.discount_percentage ? (invoice.subtotal * (invoice.discount_percentage / 100)) : 45.00);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden my-4 border border-slate-200">
        
        {/* Top actions bar (hidden in print) */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-3 no-print">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle className="h-4 w-4" />
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              Tax Invoice Generated & Saved
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex rounded-lg bg-slate-200/80 p-0.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setPaperStyle('dmart')}
                className={`rounded-md px-2.5 py-1 transition ${paperStyle === 'dmart' ? 'bg-white shadow text-teal-800' : 'text-slate-600 hover:text-slate-900'}`}
              >
                PharmaCarePro Slip (GST)
              </button>
              <button
                type="button"
                onClick={() => setPaperStyle('standard')}
                className={`rounded-md px-2.5 py-1 transition ${paperStyle === 'standard' ? 'bg-white shadow text-teal-800' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Standard A4
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Bill</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTAINER */}
        <div 
          id="printable-receipt" 
          className={`p-4 sm:p-8 font-mono text-slate-900 bg-white max-h-[82vh] overflow-y-auto ${
            paperStyle === 'dmart' ? 'max-w-md mx-auto text-xs' : 'text-xs'
          }`}
        >
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-slate-400 pb-3">
            <div className="inline-block border-2 border-slate-900 px-2 py-0.5 font-black text-sm tracking-wider uppercase mb-1">
              *** VISIT AGAIN ***
            </div>
            <h1 className="text-base sm:text-lg font-black tracking-wider uppercase text-slate-900">
              PHARMACAREPRO PHARMA
            </h1>
            <p className="text-[11px] leading-tight text-slate-700 font-medium">
              Retail Chemist & Druggist &bull; 24x7 Healthcare Services
            </p>
            <p className="text-[11px] leading-tight text-slate-700">
              Main Market Road, Phagwara, Kapurthala, Punjab 144401
            </p>
            <p className="text-[11px] font-bold text-slate-900 mt-0.5">
              Phone: +91 98765 43210 | DL No: PB-PHAG-44910/2026
            </p>
            <p className="text-[11px] text-slate-700">
              GSTIN: 03AAGCD1284P1Z3 (Composite/Regular)
            </p>
            
            <div className="mt-2 inline-block bg-slate-900 text-white font-extrabold px-4 py-0.5 text-xs tracking-widest rounded-sm">
              TAX INVOICE
            </div>
          </div>

          {/* Invoice Meta Information */}
          <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-0.5 leading-tight">
            <div className="flex justify-between">
              <span><strong>Bill No:</strong> {invoice.invoice_number}</span>
              <span><strong>Bill Dt:</strong> {formatDate(invoice.createdAt || invoice.created_at || new Date())}</span>
            </div>
            <div className="flex justify-between">
              <span><strong>Cashier:</strong> {invoice.pharmacist_name || 'Satyam Kumar (ANK/426074)'}</span>
              <span><strong>Mode:</strong> {invoice.payment_method || 'UPI'}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span><strong>Customer:</strong> {invoice.customer_name || 'Walk-in Customer'}</span>
              <span><strong>Mobile:</strong> {invoice.customer_phone || 'N/A'}</span>
            </div>
          </div>

          {/* Items Section Grouped by Indian GST Tax Slabs (Matching DMart photo) */}
          <div className="mt-2 space-y-3">
            <table className="w-full text-[11px] text-left">
              <thead>
                <tr className="border-b-2 border-slate-900 font-extrabold uppercase text-[10px]">
                  <th className="py-1 w-16">HSN</th>
                  <th className="py-1">Particulars</th>
                  <th className="py-1 text-center w-12">Qty</th>
                  <th className="py-1 text-right w-16">N/Rate</th>
                  <th className="py-1 text-right w-16">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {gstSlabs.map((rate, slabIdx) => {
                  const slabItems = groupedByGst[rate] || [];
                  const halfRate = (rate / 2).toFixed(2);
                  return (
                    <React.Fragment key={rate}>
                      {/* DMart GST Slab Group Header (e.g. 1) CGST @ 0.00%, SGST @ 0.00%) */}
                      <tr className="bg-slate-100 font-black text-[10px] text-slate-800">
                        <td colSpan="5" className="py-1 px-1 tracking-wider uppercase">
                          {slabIdx + 1}) CGST @ {halfRate}%, SGST @ {halfRate}% {rate === 0 ? '(0% Tax Exempt)' : `(${rate}% GST)`}
                        </td>
                      </tr>

                      {/* Line Items for this Slab */}
                      {slabItems.map((item, itIdx) => (
                        <tr key={itIdx} className="align-top">
                          <td className="py-1 font-mono text-[10px] text-slate-600">
                            {item.hsn_code || '3004'}
                          </td>
                          <td className="py-1 pr-1 font-semibold">
                            <div>{item.medicine_name}</div>
                            {item.generic_name && (
                              <div className="text-[9px] text-slate-500 font-sans italic">
                                Salt: {item.generic_name}
                              </div>
                            )}
                            <div className="text-[9px] text-slate-400 font-mono">
                              B: {item.batch_number || 'GEN'}
                            </div>
                          </td>
                          <td className="py-1 text-center font-bold">{item.quantity}</td>
                          <td className="py-1 text-right">{Number(item.unit_price).toFixed(2)}</td>
                          <td className="py-1 text-right font-bold">
                            {Number(item.total_price || (item.unit_price * item.quantity)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {/* Total Item Count and Quantity summary (Matching DMart photo: Items: 32 Qty: 52 2888.16) */}
            <div className="flex justify-between items-center border-t-2 border-b-2 border-slate-900 py-1.5 font-black text-xs">
              <span>Items: {totalItems}</span>
              <span>Qty: {totalQty}</span>
              <span className="text-sm font-black tracking-tight">{formatCurrency(invoice.total_amount)}</span>
            </div>

            {/* DMART GST BREAKUP DETAILS TABLE (EXACT DMART RECEIPT FORMAT) */}
            <div className="border border-slate-800 p-2 rounded-sm bg-slate-50/70 text-[10px] space-y-1">
              <div className="text-center font-black tracking-wider uppercase border-b border-dashed border-slate-400 pb-1">
                &lt;----- GST Breakup Details (Amount INR) -----&gt;
              </div>

              <table className="w-full text-left font-mono text-[10px]">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-700 font-bold uppercase">
                    <th className="py-1">GST Slab</th>
                    <th className="py-1 text-right">Taxable</th>
                    <th className="py-1 text-right">CGST</th>
                    <th className="py-1 text-right">SGST</th>
                    <th className="py-1 text-right font-bold">Total Amt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {gstBreakup.map((row, idx) => (
                    <tr key={idx}>
                      <td className="py-1 font-bold">
                        {row.gst_rate}% ({row.cgst_rate}%+{row.sgst_rate}%)
                      </td>
                      <td className="py-1 text-right">{Number(row.taxable_amount || 0).toFixed(2)}</td>
                      <td className="py-1 text-right">{Number(row.cgst_amount || 0).toFixed(2)}</td>
                      <td className="py-1 text-right">{Number(row.sgst_amount || 0).toFixed(2)}</td>
                      <td className="py-1 text-right font-bold">{Number(row.total_amount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="border-t-2 border-slate-900 font-black text-[11px]">
                    <td className="py-1">TOTAL:</td>
                    <td className="py-1 text-right">{totalTaxable.toFixed(2)}</td>
                    <td className="py-1 text-right">{totalCgst.toFixed(2)}</td>
                    <td className="py-1 text-right">{totalSgst.toFixed(2)}</td>
                    <td className="py-1 text-right">{Number(invoice.total_amount).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="pt-1 text-[9px] text-slate-500 text-center border-t border-dashed border-slate-300">
                Total Tax: ₹{totalTaxAll.toFixed(2)} (CGST: ₹{totalCgst.toFixed(2)} + SGST: ₹{totalSgst.toFixed(2)})
              </div>
            </div>

            {/* Payment Mode Received Section */}
            <div className="text-center border-t border-dashed border-slate-400 pt-2 text-[11px] leading-snug">
              <p className="text-[10px] uppercase text-slate-500 tracking-wider">
                &lt;----- Amount Received From Customer -----&gt;
              </p>
              <p className="font-extrabold text-slate-900">
                {invoice.payment_method || 'UPI'} Payment: {formatCurrency(invoice.total_amount)}
              </p>
            </div>

            {/* DMART HIGHLIGHTED SAVINGS ON MRP BANNER (Matching the yellow highlight in photo) */}
            <div className="my-3 text-center">
              <div className="inline-block w-full border-2 border-dashed border-emerald-600 bg-amber-100 dark:bg-amber-100 p-2 rounded-sm shadow-sm">
                <p className="font-black text-xs sm:text-sm text-slate-900 tracking-wider uppercase">
                  * * * Saved Rs. {Number(totalSavings).toFixed(2)} On MRP * * *
                </p>
                <p className="text-[10px] text-emerald-800 font-bold">
                  Thank You for Shopping at PharmaCarePro Pharma!
                </p>
              </div>
            </div>

            {/* Barcode & Machine Generated Stamp */}
            <div className="pt-2 text-center space-y-1">
              <div className="flex justify-center items-center gap-1 font-mono tracking-widest text-slate-800 text-xs py-1">
                <span className="font-bold">||||| | |||| ||| |||||| | ||| |||| ||||||</span>
              </div>
              <p className="text-[9px] text-slate-500 italic">
                * This is a Computer Generated Tax Invoice *
              </p>
              <div className="text-[9px] text-slate-600 font-sans border-t border-slate-200 pt-1">
                <strong>Course:</strong> Full-Stack Web Development | <strong>Student:</strong> Satyam Kumar (12314877)
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Bar (hidden in print) */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 no-print">
          <div className="text-xs text-slate-500 font-medium">
            Standard GST Compliant Invoice (H.S.N 3004 / 3808)
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Close Invoice
          </button>
        </div>

      </div>
    </div>
  );
}

