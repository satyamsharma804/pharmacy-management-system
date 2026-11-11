import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Receipt, 
  DollarSign, 
  Trash2, 
  Mail, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  X,
  Search
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function StaffManagement() {
  const { user: currentUser } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal for adding new cashier/pharmacist
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('cashier');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/auth/staff');
      setStaffList(data);
    } catch (err) {
      setError(err.message || 'Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    setSuccessMsg('');

    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: {
          name,
          email,
          phone,
          password,
          role
        }
      });

      setSuccessMsg(`Account for "${name}" created successfully as ${role === 'admin' ? 'Administrator' : 'Cashier / Pharmacist'}!`);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setRole('cashier');
      setModalOpen(false);
      loadStaff();
    } catch (err) {
      setModalError(err.message || 'Failed to create staff account');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id, staffName) => {
    if (id === currentUser?.id) {
      alert('You cannot delete your own logged-in admin account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove cashier/staff account "${staffName}"?`)) return;

    try {
      await apiRequest(`/auth/users/${id}`, { method: 'DELETE' });
      loadStaff();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const filteredStaff = staffList.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  );

  const totalSalesProcessed = staffList.reduce((acc, s) => acc + (s.total_sales || 0), 0);
  const totalRevenueCollected = staffList.reduce((acc, s) => acc + (s.total_revenue || 0), 0);
  const cashiersCount = staffList.filter(s => s.role !== 'admin').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <span>Cashiers & Staff Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor registered cashiers and pharmacists, track billing performance, and control store roles
          </p>
        </div>

        <button
          onClick={() => {
            setModalError('');
            setModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-700/20 hover:from-teal-700 hover:to-teal-800 transition cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add New Cashier / Pharmacist</span>
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Staff Accounts</span>
            <div className="rounded-xl bg-teal-50 dark:bg-teal-950 p-2 text-teal-600 dark:text-teal-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{staffList.length}</div>
          <p className="mt-1 text-[11px] text-slate-400">Administrators & Cashiers</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Active Cashiers</span>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950 p-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">{cashiersCount}</div>
          <p className="mt-1 text-[11px] text-slate-400">Authorized for POS Billing</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Bills Processed</span>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950 p-2 text-blue-600 dark:text-blue-400">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{totalSalesProcessed}</div>
          <p className="mt-1 text-[11px] text-slate-400">Transactions across all shifts</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Counter Revenue</span>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950 p-2 text-amber-600 dark:text-amber-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            ₹{totalRevenueCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Total payments collected</p>
        </div>
      </div>

      {/* Staff Table & Search */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff by name, email, or phone..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">{filteredStaff.length} staff members</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Staff Member</th>
                <th className="py-3 px-4 font-semibold">Contact</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Joined On</th>
                <th className="py-3 px-4 font-semibold text-center">Bills Created</th>
                <th className="py-3 px-4 font-semibold text-right">Revenue Handled</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    Loading staff members...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No staff members found
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const isAdmin = staff.role === 'admin';
                  const isCurrent = staff.id === currentUser?.id;

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs ${
                            isAdmin 
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' 
                              : 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                          }`}>
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{staff.name}</span>
                              {isCurrent && (
                                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">{staff.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{staff.phone || 'N/A'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          isAdmin
                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}>
                          <ShieldCheck className="h-3 w-3" />
                          {isAdmin ? 'Administrator' : 'Cashier / Pharmacist'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {new Date(staff.createdAt || Date.now()).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-white">
                        {staff.total_sales || 0}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-teal-600 dark:text-teal-400">
                        ₹{(staff.total_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!isCurrent && (
                          <button
                            onClick={() => handleDelete(staff.id, staff.name)}
                            title="Remove account"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-teal-600" />
                <span>Register New Staff Account</span>
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address (Login)
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. priya@pharmacy.com"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 99887 76655"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Store Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="cashier">Cashier / Pharmacist (POS Billing & Medicine Management)</option>
                  <option value="admin">Administrator (Full Store & Staff Access)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 py-2.5 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 shadow-md shadow-teal-700/20 disabled:opacity-50"
                >
                  {modalLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
