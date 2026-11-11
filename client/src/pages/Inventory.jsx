import React, { useState, useEffect } from 'react';
import { apiRequest, formatCurrency, formatDate } from '../utils/api';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  Clock, 
  Filter, 
  X, 
  Save, 
  Pill,
  CheckCircle2,
  Package
} from 'lucide-react';

export default function Inventory() {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterType, setFilterType] = useState('all'); // 'all', 'low_stock', 'expiring_soon'
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    category: 'Analgesic / Antipyretic',
    batch_number: '',
    supplier_id: '',
    purchase_price: '',
    selling_price: '',
    quantity: '',
    min_stock_level: 10,
    expiry_date: '',
    dosage_form: 'Tablet',
    strength: '',
    location_shelf: '',
    description: ''
  });
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      let query = `?search=${encodeURIComponent(search)}`;
      if (selectedCategory !== 'All') query += `&category=${encodeURIComponent(selectedCategory)}`;
      if (filterType === 'low_stock') query += `&low_stock=true`;
      if (filterType === 'expiring_soon') query += `&expiring_soon=true`;

      const [meds, cats, supps] = await Promise.all([
        apiRequest(`/medicines${query}`),
        apiRequest('/medicines/meta/categories'),
        apiRequest('/suppliers')
      ]);

      setMedicines(meds);
      setCategories(cats);
      setSuppliers(supps);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategory, filterType]);

  const handleOpenModal = (med = null) => {
    setFormError('');
    if (med) {
      setEditingMedicine(med);
      setFormData({
        name: med.name,
        generic_name: med.generic_name || '',
        category: med.category,
        batch_number: med.batch_number,
        supplier_id: med.supplier_id || '',
        purchase_price: med.purchase_price,
        selling_price: med.selling_price,
        quantity: med.quantity,
        min_stock_level: med.min_stock_level,
        expiry_date: med.expiry_date,
        dosage_form: med.dosage_form || 'Tablet',
        strength: med.strength || '',
        location_shelf: med.location_shelf || '',
        description: med.description || ''
      });
    } else {
      setEditingMedicine(null);
      // Auto-generate random batch
      const randomBatch = 'BATCH-' + Math.floor(1000 + Math.random() * 9000);
      setFormData({
        name: '',
        generic_name: '',
        category: categories[0] || 'Antibiotic',
        batch_number: randomBatch,
        supplier_id: suppliers[0]?.id || '',
        purchase_price: '',
        selling_price: '',
        quantity: 50,
        min_stock_level: 15,
        expiry_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        dosage_form: 'Tablet',
        strength: '500mg',
        location_shelf: 'Shelf A-1',
        description: ''
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      if (editingMedicine) {
        await apiRequest(`/medicines/${editingMedicine.id}`, {
          method: 'PUT',
          body: formData
        });
      } else {
        await apiRequest('/medicines', {
          method: 'POST',
          body: formData
        });
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from inventory?`)) return;

    try {
      await apiRequest(`/medicines/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete medicine');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Medicine Inventory</h1>
          <p className="text-xs text-slate-500">Track pharmaceutical stock levels, batch numbers, locations and expiry dates</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-700/20 hover:from-teal-700 hover:to-teal-800 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Medicine</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by medicine name, generic name, or batch number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="w-full sm:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs focus:border-teal-500 focus:bg-white focus:outline-none"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-slate-400 mr-1">Filter by:</span>
          <button
            onClick={() => setFilterType('all')}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              filterType === 'all'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Medicines ({medicines.length})
          </button>
          <button
            onClick={() => setFilterType('low_stock')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
              filterType === 'low_stock'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Low Stock</span>
          </button>
          <button
            onClick={() => setFilterType('expiring_soon')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
              filterType === 'expiring_soon'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>Expiring Soon (&le;30 Days)</span>
          </button>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-3 px-4 font-semibold">Medicine Details</th>
                <th className="py-3 px-4 font-semibold">Category / Dosage</th>
                <th className="py-3 px-4 font-semibold">Batch / Shelf</th>
                <th className="py-3 px-4 font-semibold">Cost / Sell Price</th>
                <th className="py-3 px-4 font-semibold text-center">Stock Level</th>
                <th className="py-3 px-4 font-semibold">Expiry Date</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
                    <p className="mt-2 text-xs">Loading medicines...</p>
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Package className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">No medicines matched your query</p>
                    <p className="text-xs">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                medicines.map((m) => {
                  const isLow = m.quantity <= m.min_stock_level;
                  const isExpiring = new Date(m.expiry_date) <= new Date(Date.now() + 30 * 86400000);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="text-[11px] text-slate-400">{m.generic_name || 'Generic'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700">{m.category}</span>
                        <div className="text-[11px] text-slate-400">{m.dosage_form} &bull; {m.strength || 'Standard'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-semibold text-slate-800">{m.batch_number}</span>
                        <div className="text-[11px] text-slate-400">Loc: {m.location_shelf || 'General'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{formatCurrency(m.selling_price)}</div>
                        <div className="text-[10px] text-slate-400">Cost: {formatCurrency(m.purchase_price)}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            m.quantity === 0
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {m.quantity} Units
                        </span>
                        {isLow && m.quantity > 0 && (
                          <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Min: {m.min_stock_level}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className={`font-semibold ${isExpiring ? 'text-rose-600' : 'text-slate-700'}`}>
                          {formatDate(m.expiry_date)}
                        </div>
                        {isExpiring && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-bold">
                            <Clock className="h-3 w-3" /> Expiring Soon
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenModal(m)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-teal-50 hover:text-teal-700 transition"
                            title="Edit Medicine"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id, m.name)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Delete Medicine"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Medicine Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pill className="h-5 w-5 text-teal-600" />
                <span>{editingMedicine ? 'Edit Medicine Record' : 'Register New Medicine to Stock'}</span>
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="rounded-xl bg-rose-50 p-3 text-rose-700 border border-rose-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand / Trade Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol 650 (Dolo)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs focus:border-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Generic / Chemical Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acetaminophen"
                    value={formData.generic_name}
                    onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs focus:border-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="Antibiotic, Analgesic, etc."
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs focus:border-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DOL-8821"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-mono focus:border-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs focus:border-teal-500 focus:bg-white focus:outline-none"
                  >
                    <option value="">No Supplier Selected</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="15.00"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs focus:border-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="30.00"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs focus:border-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    placeholder="100"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs focus:border-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Alert Level</label>
                  <input
                    type="number"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs focus:border-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs focus:border-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosage Form</label>
                  <select
                    value={formData.dosage_form}
                    onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs focus:border-teal-500 focus:bg-white focus:outline-none"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Powder">Powder</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shelf Location</label>
                  <input
                    type="text"
                    placeholder="Shelf A-1, Fridge, etc."
                    value={formData.location_shelf}
                    onChange={(e) => setFormData({ ...formData, location_shelf: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs focus:border-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows="2"
                  placeholder="Usage instructions, prescription requirements, etc."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs focus:border-teal-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-teal-700"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{editingMedicine ? 'Update Medicine' : 'Save to Inventory'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
