import React, { useState, useEffect, useRef } from 'react';
import { apiRequest, formatCurrency, formatDate } from '../utils/api';
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
  History,
  ShieldAlert,
  X,
  Repeat,
  Sparkles,
  Clock,
  ArrowRight,
  Layers,
  FlaskConical,
  Receipt,
  BadgePercent
} from 'lucide-react';
import confetti from 'canvas-confetti';
import InvoiceModal from '../components/InvoiceModal';

export default function POSBilling() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [searchMode, setSearchMode] = useState('all'); // 'all', 'brand', 'salt'
  const [cart, setCart] = useState([]);
  
  // Customer details & Auto-suggest state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customerHistoryModal, setCustomerHistoryModal] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Generic Salt Substitute Finder state
  const [substituteModal, setSubstituteModal] = useState(false);
  const [selectedSubMedicine, setSelectedSubMedicine] = useState(null);
  const [substitutesList, setSubstitutesList] = useState([]);
  const [loadingSubstitutes, setLoadingSubstitutes] = useState(false);

  // Bill calculations & Payment
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedInvoice, setGeneratedInvoice] = useState(null);

  const phoneInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Load medicines catalog & categories
  const loadMedicines = async () => {
    try {
      let query = '';
      if (searchMode === 'salt') {
        query = `?composition=${encodeURIComponent(search)}`;
      } else {
        query = `?search=${encodeURIComponent(search)}`;
      }
      if (selectedCategory !== 'All') query += `&category=${encodeURIComponent(selectedCategory)}`;
      
      const [medsData, catsData] = await Promise.all([
        apiRequest(`/medicines${query}`),
        apiRequest('/medicines/meta/categories')
      ]);
      setMedicines(medsData);
      setCategories(catsData);
    } catch (err) {
      console.error('Failed to load medicines:', err);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, [search, selectedCategory, searchMode]);

  // Customer phone/number search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      const term = customerPhone.trim() || customerName.trim();
      if (term.length >= 2 && !selectedCustomer) {
        try {
          const results = await apiRequest(`/customers?search=${encodeURIComponent(term)}`);
          setCustomerSuggestions(results.slice(0, 6));
          setShowSuggestions(results.length > 0);

          // If a full 10-digit phone number is entered, auto-link existing customer
          const cleanInputDigits = customerPhone.replace(/\D/g, '');
          if (cleanInputDigits.length >= 10) {
            const exactMatch = results.find(c => {
              const custDigits = (c.phone || '').replace(/\D/g, '');
              return custDigits === cleanInputDigits || custDigits.endsWith(cleanInputDigits) || cleanInputDigits.endsWith(custDigits);
            });
            if (exactMatch) {
              setSelectedCustomer(exactMatch);
              setCustomerName(exactMatch.name);
              setShowSuggestions(false);
            }
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        setCustomerSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timer);
  }, [customerPhone, customerName, selectedCustomer]);

  // Handle outside click to close customer suggestions
  useEffect(() => {
    function handleClickOutside(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Select customer from suggestions
  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone);
    setShowSuggestions(false);
  };

  // Clear customer selection
  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
  };

  // Open Customer Purchase History
  const handleOpenCustomerHistory = async () => {
    if (!selectedCustomer) return;
    setLoadingHistory(true);
    setCustomerHistoryModal(true);
    try {
      const custData = await apiRequest(`/customers/${selectedCustomer.id || selectedCustomer._id}`);
      setCustomerOrders(custData.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Open Generic Salt Substitutes & Brand Comparison Modal
  const handleOpenSubstitutes = async (med, e) => {
    if (e) e.stopPropagation();
    setSelectedSubMedicine(med);
    setSubstituteModal(true);
    setLoadingSubstitutes(true);
    try {
      const data = await apiRequest(`/medicines/substitutes/${med.id || med._id}`);
      setSubstitutesList(data.substitutes || []);
    } catch (err) {
      console.error('Failed to load substitutes:', err);
      setSubstitutesList([]);
    } finally {
      setLoadingSubstitutes(false);
    }
  };

  // Cart operations
  const addToCart = (med) => {
    if (med.quantity <= 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.medicine_id === (med.id || med._id));
      if (existing) {
        if (existing.quantity >= med.quantity) {
          alert(`Cannot add more than available stock (${med.quantity} units).`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.medicine_id === (med.id || med._id)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            medicine_id: med.id || med._id,
            name: med.name,
            generic_name: med.generic_name || '',
            batch_number: med.batch_number,
            hsn_code: med.hsn_code || '3004',
            gst_rate: med.gst_rate !== undefined ? med.gst_rate : 12,
            mrp: med.mrp || (med.selling_price * 1.25),
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

  // Reorder past medicine from customer history
  const handleReorderPastItem = (item) => {
    const med = medicines.find(m => (m.id || m._id) === item.medicine_id || m.name === item.medicine_name);
    if (med) {
      addToCart(med);
    } else {
      alert(`"${item.medicine_name}" is currently not available in live inventory.`);
    }
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
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountPercent(0);
    setError('');
  };

  // Indian GST & DMart Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  const discountMultiplier = 1 - (Number(discountPercent) / 100);
  const discountAmount = subtotal * (Number(discountPercent) / 100);

  // Group GST by Indian Slabs (0%, 5%, 12%, 18%)
  const gstBreakupLive = cart.reduce((acc, item) => {
    const rate = Number(item.gst_rate !== undefined ? item.gst_rate : 12);
    const itemTotal = item.selling_price * item.quantity;
    const taxable = itemTotal * discountMultiplier;
    const halfRate = rate / 2;
    const cgst = taxable * (halfRate / 100);
    const sgst = taxable * (halfRate / 100);
    const totalTax = cgst + sgst;

    if (!acc[rate]) {
      acc[rate] = { rate, taxable: 0, cgst: 0, sgst: 0, totalTax: 0 };
    }
    acc[rate].taxable += taxable;
    acc[rate].cgst += cgst;
    acc[rate].sgst += sgst;
    acc[rate].totalTax += totalTax;
    return acc;
  }, {});

  const gstBreakupArray = Object.values(gstBreakupLive).sort((a, b) => a.rate - b.rate);
  const totalTaxAmount = gstBreakupArray.reduce((sum, g) => sum + g.totalTax, 0);
  const totalCgstAmount = gstBreakupArray.reduce((sum, g) => sum + g.cgst, 0);
  const totalSgstAmount = gstBreakupArray.reduce((sum, g) => sum + g.sgst, 0);
  const grandTotal = subtotal - discountAmount + totalTaxAmount;

  // Total savings on MRP (DMart style highlight)
  const totalMrp = cart.reduce((sum, item) => sum + Number(item.mrp || item.selling_price * 1.25) * item.quantity, 0);
  const totalSavings = Math.max(0, totalMrp - grandTotal);

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
        customer_id: selectedCustomer ? (selectedCustomer.id || selectedCustomer._id) : null,
        customer_name: customerName.trim() || 'Walk-in Customer',
        customer_phone: customerPhone.trim(),
        pharmacist_id: user?.id || null,
        items: cart.map((item) => ({
          medicine_id: item.medicine_id,
          quantity: item.quantity
        })),
        discount_percentage: Number(discountPercent),
        payment_method: paymentMethod,
        notes: notes.trim()
      };

      const res = await apiRequest('/sales', {
        method: 'POST',
        body: payload
      });

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      setGeneratedInvoice(res.invoice);
      clearCart();
      loadMedicines(); // Refresh stock
    } catch (err) {
      setError(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: Medicine Catalog & Filters (7 Cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search & Category Filter */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3 transition-colors">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  searchMode === 'salt'
                    ? "Enter active salt / formula: e.g. Paracetamol, Amoxicillin..."
                    : "Search medicine by brand name, active formula, or barcode..."
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
              />
            </div>

            {/* Search Mode Toggles */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setSearchMode('all')}
                className={`rounded-lg px-2.5 py-1.5 transition ${searchMode === 'all' ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('salt')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition ${searchMode === 'salt' ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <FlaskConical className="h-3 w-3" />
                <span>By Salt</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`rounded-lg px-3 py-1 font-semibold whitespace-nowrap transition ${
                selectedCategory === 'All'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Medicines
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-2.5 py-1 font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Medicines Catalog Grid */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Medicines Catalog</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">{medicines.length} items found</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-1">
            {medicines.map((med) => {
              const inStock = med.quantity > 0;
              const isLow = med.quantity <= med.min_stock_level && inStock;
              const cartItem = cart.find((c) => c.medicine_id === (med.id || med._id));

              return (
                <div
                  key={med.id || med._id}
                  onClick={() => inStock && addToCart(med)}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all ${
                    !inStock
                      ? 'border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 opacity-75'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-md cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                        {med.name}
                      </span>
                      <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                        {med.dosage_form}
                      </span>
                    </div>

                    {/* Active Salt Composition */}
                    <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                      <FlaskConical className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">Salt: {med.generic_name || med.category}</span>
                    </div>

                    {/* Indian GST Tax Slab & HSN Badge */}
                    <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                      <span className={`rounded px-1.5 py-0.5 font-bold ${
                        med.gst_rate === 0
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                          : med.gst_rate === 5
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : med.gst_rate === 12
                          ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                          : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                      }`}>
                        {med.gst_rate ?? 12}% GST
                      </span>
                      <span className="font-mono text-slate-400 dark:text-slate-500">
                        HSN: {med.hsn_code || '3004'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                    <div>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {formatCurrency(med.selling_price)}
                      </span>
                      {med.mrp && med.mrp > med.selling_price && (
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 line-through">
                          MRP {formatCurrency(med.mrp)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          !inStock
                            ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400'
                            : isLow
                            ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        {inStock ? `${med.quantity} left` : 'Out of stock'}
                      </span>
                      {cartItem && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white shadow-sm">
                          {cartItem.quantity}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Find Substitutes Button */}
                  <button
                    type="button"
                    onClick={(e) => handleOpenSubstitutes(med, e)}
                    className="mt-2.5 w-full flex items-center justify-center gap-1.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/80 dark:bg-teal-950/60 py-1.5 text-[11px] font-bold text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 transition"
                    title="Find alternative brand names with identical composition and compare prices"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Find Substitutes (Same Salt)</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Customer Lookup, Cart & POS Register (5 Cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">POS Checkout Terminal</h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Customer Auto-Suggest Input & History */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Customer / Patient Details
              </label>
              {selectedCustomer && (
                <button
                  type="button"
                  onClick={handleClearCustomer}
                  className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  <span>Reset to Walk-in</span>
                </button>
              )}
            </div>

            <div className="relative" ref={suggestionsRef}>
              <div className="grid grid-cols-2 gap-2">
                {/* Phone Input with Auto-Suggest */}
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    ref={phoneInputRef}
                    type="text"
                    placeholder="Mobile: +91 99999..."
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      if (selectedCustomer) setSelectedCustomer(null);
                    }}
                    onFocus={() => {
                      if (customerSuggestions.length > 0) setShowSuggestions(true);
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 pl-8 pr-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
                  />
                </div>

                {/* Name Input */}
                <div className="relative">
                  <User className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Walk-in Customer"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (selectedCustomer) setSelectedCustomer(null);
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 pl-8 pr-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Autocomplete Dropdown List */}
              {showSuggestions && customerSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 p-2 shadow-2xl space-y-1">
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Existing Customer Matches
                  </p>
                  {customerSuggestions.map((cust) => {
                    const hasAllergy = cust.allergies && cust.allergies.toLowerCase() !== 'none';
                    return (
                      <div
                        key={cust.id || cust._id}
                        onClick={() => handleSelectCustomer(cust)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-800 cursor-pointer transition"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{cust.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{cust.phone}</p>
                          {hasAllergy && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                              <ShieldAlert className="h-3 w-3" /> Allergy: {cust.allergies}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="rounded-full bg-teal-100 dark:bg-teal-950 px-2 py-0.5 text-[10px] font-semibold text-teal-800 dark:text-teal-300">
                            {cust.total_orders || 0} bills
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Customer Status Badge & History Button */}
            {selectedCustomer && (
              <div className="rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/70 dark:bg-teal-950/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white font-bold text-xs">
                      {selectedCustomer.name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {selectedCustomer.name}
                      </p>
                      <p className="text-[10px] text-teal-700 dark:text-teal-300 font-mono">
                        {selectedCustomer.phone}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenCustomerHistory}
                    className="flex items-center gap-1.5 rounded-lg border border-teal-300 dark:border-teal-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-bold text-teal-700 dark:text-teal-300 shadow-sm hover:bg-teal-50 dark:hover:bg-slate-800 transition"
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>View History</span>
                  </button>
                </div>

                {/* Patient Allergy Warning Alert */}
                {selectedCustomer.allergies && selectedCustomer.allergies.toLowerCase() !== 'none' && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/70 p-2 text-xs font-bold text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    <ShieldAlert className="h-4 w-4 flex-shrink-0 text-rose-600" />
                    <span>Contraindication Warning: Patient allergic to {selectedCustomer.allergies}!</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="max-h-60 overflow-y-auto space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                <Pill className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Cart is empty</p>
                <p className="text-[11px]">Click any medicine from the catalog to add it to the bill.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.medicine_id} className="pt-2 flex items-center justify-between">
                  <div className="flex-1 pr-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {formatCurrency(item.selling_price)} &times; {item.quantity} = {formatCurrency(item.selling_price * item.quantity)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      <button
                        onClick={() => updateQuantity(item.medicine_id, -1)}
                        className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-800 dark:text-slate-200">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.medicine_id, 1)}
                        className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.medicine_id)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition"
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
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-3">
              {/* Discount Presets & Custom % */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Discount:</span>
                  <div className="flex items-center gap-1">
                    {[0, 5, 10, 15].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDiscountPercent(pct)}
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-bold transition ${
                          Number(discountPercent) === pct
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {pct === 0 ? 'None' : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Custom Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Tax Calculation</label>
                    <div className="rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/60 dark:bg-teal-950/40 px-2 py-1.5 text-[11px] font-bold text-teal-800 dark:text-teal-300">
                      Auto Item GST (0, 5, 12, 18%)
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Payment Method</label>
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
                            ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-200 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DMart Style Indian GST & Totals Summary */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3.5 space-y-2 text-xs border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal (Items Total):</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Store Discount ({discountPercent}%):</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                {/* Indian GST Breakup Table Preview */}
                <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <span>GST Tax (CGST + SGST):</span>
                    <span className="text-teal-600 dark:text-teal-400 font-mono">+{formatCurrency(totalTaxAmount)}</span>
                  </div>
                  {gstBreakupArray.map((g) => (
                    <div key={g.rate} className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 pl-2">
                      <span>&bull; Slab {g.rate}% ({g.rate / 2}% CGST + {g.rate / 2}% SGST):</span>
                      <span className="font-mono">{formatCurrency(g.totalTax)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 text-base font-black text-slate-900 dark:text-white">
                  <span>Payable Total:</span>
                  <span className="text-teal-600 dark:text-teal-400">{formatCurrency(grandTotal)}</span>
                </div>

                {/* DMart Savings on Printed MRP */}
                {totalSavings > 0 && (
                  <div className="mt-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 p-2 text-center text-xs font-black text-slate-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 shadow-sm">
                    🎉 Customer Saves {formatCurrency(totalSavings)} on Printed MRP!
                  </div>
                )}
              </div>

              {/* Error Alert */}
              {error && (
                <div className="flex items-center gap-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-2 text-xs text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
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

      {/* Customer Purchase History Modal */}
      {customerHistoryModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <span>{selectedCustomer.name}'s Purchase History</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Phone: {selectedCustomer.phone} &bull; {customerOrders.length} Past Invoices
                </p>
              </div>
              <button
                onClick={() => setCustomerHistoryModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 max-h-[420px] overflow-y-auto space-y-3">
              {loadingHistory ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
                  <p className="mt-2 text-xs">Loading purchase records...</p>
                </div>
              ) : customerOrders.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">
                  No previous transactions found for this customer.
                </p>
              ) : (
                customerOrders.map((ord) => (
                  <div key={ord.id || ord._id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{ord.invoice_number}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-2">
                          {formatDate(ord.createdAt || ord.created_at)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 dark:text-white">{formatCurrency(ord.total_amount)}</span>
                        <span className="ml-2 rounded bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] uppercase font-semibold">
                          {ord.payment_method}
                        </span>
                      </div>
                    </div>

                    {/* Line Items with Quick Reorder Button */}
                    {ord.items && ord.items.length > 0 && (
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-2 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Medicines Dispensed:</p>
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                              &bull; {it.medicine_name} ({it.quantity} {it.dosage_form || 'units'})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleReorderPastItem(it)}
                              className="inline-flex items-center gap-1 rounded bg-teal-50 dark:bg-teal-950/80 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition"
                              title="Add this medicine to active cart"
                            >
                              <Repeat className="h-3 w-3" />
                              <span>+ Add to Cart</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-6 py-3 text-right">
              <button
                onClick={() => setCustomerHistoryModal(false)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Salt Substitutes & Brand Comparison Modal */}
      {substituteModal && selectedSubMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white">
                    <FlaskConical className="h-4 w-4" />
                  </span>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Generic Salt Substitutes & Brand Comparison
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Active Formula: <strong className="text-teal-700 dark:text-teal-300 font-semibold">{selectedSubMedicine.generic_name || selectedSubMedicine.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setSubstituteModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Requested Brand Banner */}
            <div className="px-6 py-3 bg-teal-50/50 dark:bg-teal-950/30 border-b border-teal-100 dark:border-teal-900/50 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                  Requested Brand:
                </p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {selectedSubMedicine.name} &bull; {selectedSubMedicine.strength}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(selectedSubMedicine.selling_price)}
                </span>
                <span className={`block text-[10px] font-bold ${selectedSubMedicine.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {selectedSubMedicine.quantity > 0 ? `${selectedSubMedicine.quantity} in stock` : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Substitutes List */}
            <div className="p-6 max-h-[400px] overflow-y-auto space-y-3">
              {loadingSubstitutes ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
                  <p className="mt-2 text-xs">Scanning inventory for matching active salt...</p>
                </div>
              ) : substitutesList.length === 0 ? (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                  <Pill className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-semibold">No alternative brands found in current stock</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    No other medicine in stock currently shares the exact formula "{selectedSubMedicine.generic_name}".
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {substitutesList.length} Alternative Brand(s) with identical chemical salt:
                  </p>
                  {substitutesList.map((sub) => {
                    const priceDiff = selectedSubMedicine.selling_price - sub.selling_price;
                    const isCheaper = priceDiff > 0;
                    return (
                      <div
                        key={sub.id || sub._id}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5 flex items-center justify-between hover:border-teal-400 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {sub.name}
                            </span>
                            <span className="rounded bg-teal-100 dark:bg-teal-950 px-1.5 py-0.5 text-[10px] font-bold text-teal-800 dark:text-teal-300">
                              {sub.dosage_form} &bull; {sub.strength}
                            </span>
                            <span className="rounded bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-700 dark:text-slate-300">
                              {sub.gst_rate ?? 12}% GST
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Supplier: {sub.supplier_name || 'Standard Pharma'} &bull; Shelf: {sub.location_shelf || 'A-1'}
                          </p>
                          {isCheaper && (
                            <span className="inline-block text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              &bull; Customer saves {formatCurrency(priceDiff)} per strip ({Math.round((priceDiff / selectedSubMedicine.selling_price) * 100)}% cheaper!)
                            </span>
                          )}
                        </div>

                        <div className="text-right space-y-1.5 flex-shrink-0 ml-3">
                          <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {formatCurrency(sub.selling_price)}
                          </div>
                          <button
                            type="button"
                            disabled={sub.quantity <= 0}
                            onClick={() => {
                              addToCart(sub);
                              setSubstituteModal(false);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition disabled:opacity-50 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add to Cart ({sub.quantity} left)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-6 py-3 text-right">
              <button
                onClick={() => setSubstituteModal(false)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
