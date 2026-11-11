import React, { useState, useEffect } from 'react';
import { apiRequest, formatCurrency } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  QrCode, 
  User, 
  Phone, 
  CheckCircle,
  AlertCircle,
  Pill,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import InvoiceModal from '../components/InvoiceModal';

export default function POSBilling() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(5);
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedInvoice, setGeneratedInvoice] = useState(null);

  // Fetch medicines for catalog
  const loadMedicines = async (query = '') => {
    try {
      const data = await apiRequest(`/medicines?search=${encodeURIComponent(query)}`);
      setMedicines(data);
    } catch (err) {
      console.error('Failed to load medicines:', err);
    }
  };

  useEffect(() => {
    loadMedicines(search);
  }, [search]);

  // Cart operations
  const addToCart = (med) => {
    if (med.quantity <= 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.medicine_id === med.id);
      if (existing) {
        if (existing.quantity >= med.quantity) {
          alert(`Cannot add more than available stock (${med.quantity} units).`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.medicine_id === med.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            medicine_id: med.id,
            name: med.name,
            batch_number: med.batch_number,
            selling_price: med.selling_price,
            max_stock: med.quantity,
            dosage_form: med.dosage_form,
            strength: med.strength,
            quantity: 1
          }
        ];
      }
    });
  };

  const updateQuantity = (medId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.medicine_id === medId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.max_stock) {
              alert(`Maximum available stock is ${item.max_stock}`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (medId) => {
    setCart((prevCart) => prevCart.filter((item) => item.medicine_id !== medId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountPercent(0);
    setError('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  const discountAmount = subtotal * (Number(discountPercent) / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (Number(taxPercent) / 100);
  const grandTotal = taxableAmount + taxAmount;

  // Checkout Handler
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Please add at least one medicine to cart');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        customer_name: customerName.trim() || 'Walk-in Customer',
        customer_phone: customerPhone.trim(),
        pharmacist_id: user?.id || 1,
        items: cart.map((item) => ({
          medicine_id: item.medicine_id,
          quantity: item.quantity
        })),
        discount_percentage: Number(discountPercent),
        tax_percentage: Number(taxPercent),
        payment_method: paymentMethod,
        notes: notes.trim()
      };

      const res = await apiRequest('/sales', {
        method: 'POST',
        body: payload
      });

      // Launch celebration confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      setGeneratedInvoice(res.invoice);
      clearCart();
      loadMedicines(); // Refresh stock counts
    } catch (err) {
      setError(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: Medicine Catalog & Search (7 Cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicine name, generic name, or batch number..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
            />
          </div>
        </div>

        {/* Medicines Catalog Grid */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900">Available Pharmacy Inventory</h2>
            <span className="text-xs text-slate-500">{medicines.length} medicines listed</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {medicines.map((med) => {
              const inStock = med.quantity > 0;
              const isLow = med.quantity <= med.min_stock_level && inStock;
              const cartItem = cart.find((c) => c.medicine_id === med.id);

              return (
                <div
                  key={med.id}
                  onClick={() => inStock && addToCart(med)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                    !inStock
                      ? 'border-slate-200 bg-slate-100/60 opacity-60 cursor-not-allowed'
                      : 'border-slate-200/90 bg-white hover:border-teal-400 hover:shadow-md cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition">
                        {med.name}
                      </span>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                        {med.dosage_form}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{med.generic_name || med.category}</p>
                    <p className="mt-1 text-[10px] text-slate-400 font-mono">B: {med.batch_number} &bull; Loc: {med.location_shelf || 'Main'}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="text-sm font-black text-slate-900">
                      {formatCurrency(med.selling_price)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          !inStock
                            ? 'bg-rose-100 text-rose-700'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {inStock ? `${med.quantity} left` : 'Out of stock'}
                      </span>
                      {cartItem && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
                          {cartItem.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: POS Billing Cart & Customer (5 Cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Active Dispense Cart</h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Customer Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Name</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Walk-in Customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-xs focus:border-teal-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="+91 99999 00000"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-xs focus:border-teal-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="max-h-64 overflow-y-auto space-y-2 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Pill className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-medium">Cart is empty.</p>
                <p className="text-[11px]">Select medicines from the inventory list to dispense.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.medicine_id} className="pt-2 flex items-center justify-between">
                  <div className="flex-1 pr-2">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {formatCurrency(item.selling_price)} &times; {item.quantity} = {formatCurrency(item.selling_price * item.quantity)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50">
                      <button
                        onClick={() => updateQuantity(item.medicine_id, -1)}
                        className="p-1 text-slate-600 hover:text-slate-900"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.medicine_id, 1)}
                        className="p-1 text-slate-600 hover:text-slate-900"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.medicine_id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Discounts, Tax & Payment Options */}
          {cart.length > 0 && (
            <div className="border-t border-slate-200 pt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs focus:border-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tax / GST %</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs focus:border-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                    { id: 'Cash', label: 'Cash', icon: Banknote },
                    { id: 'Card', label: 'Card', icon: CreditCard }
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition ${
                          paymentMethod === m.id
                            ? 'border-teal-600 bg-teal-50 text-teal-800'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Totals Summary */}
              <div className="rounded-xl bg-slate-50 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount ({discountPercent}%):</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({taxPercent}%):</span>
                  <span>+{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold text-slate-900">
                  <span>Payable Total:</span>
                  <span className="text-teal-700">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="flex items-center gap-1.5 rounded-xl bg-rose-50 p-2 text-xs text-rose-700 border border-rose-200">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Checkout Button */}
              <button
                type="button"
                disabled={loading}
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 py-3 text-sm font-extrabold text-white shadow-lg shadow-teal-700/20 hover:from-teal-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:opacity-50 transition cursor-pointer"
              >
                <CheckCircle className="h-4 w-4" />
                <span>{loading ? 'Processing Transaction...' : `Complete Sale • ${formatCurrency(grandTotal)}`}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Popup Modal upon sale completion */}
      {generatedInvoice && (
        <InvoiceModal
          invoice={generatedInvoice}
          onClose={() => setGeneratedInvoice(null)}
        />
      )}
    </div>
  );
}

