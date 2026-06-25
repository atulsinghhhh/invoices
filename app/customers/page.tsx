"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface CustomerInvoiceSummary {
  grandTotal: number;
  status: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  state: string | null;
  stateCode: string | null;
  totalInvoiced: number;
  outstanding: number;
  _count: {
    invoices: number;
  };
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gstin, setGstin] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("");
  const [stateCode, setStateCode] = useState("");

  // Fetch customers
  async function fetchCustomers(query = "") {
    try {
      const url = query ? `/api/customers?q=${encodeURIComponent(query)}` : "/api/customers";
      const res = await fetch(url);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 404) {
        router.push("/setup");
        return;
      }
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    fetchCustomers();
  }, [router]);

  // Debounced/delayed search trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers(searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Handle Add Customer Submission
  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Customer name is required.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          gstin: gstin.trim() || null,
          state: state.trim() || null,
          stateCode: stateCode.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create customer");
      }

      // Reset form and close modal
      setName("");
      setPhone("");
      setEmail("");
      setGstin("");
      setAddress("");
      setState("");
      setStateCode("");
      setShowModal(false);

      // Refresh list
      fetchCustomers(searchQuery);
    } catch (err: any) {
      setFormError(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  }

  const fmt = (n: number) => `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col flex-1 max-w-7xl mx-auto w-full pt-4 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Customers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your clients and billing relationships.</p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-full shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search customers by name or phone"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2.5 w-full rounded-xl border border-[var(--border)] bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)]"
          />
        </div>
      </div>

      {/* Table / List Container */}
      <div className="bg-[var(--surface)] backdrop-blur rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm">Fetching customer list...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <p className="text-lg font-medium mb-2">No customers found</p>
            <p className="text-sm">Click &quot;Add Customer&quot; above to create one.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)] bg-gray-50/60 dark:bg-gray-800/40">
                {['Customer', 'Invoices', 'Total Revenue', 'Outstanding', 'Actions'].map((h, i) => (
                  <th key={i} className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {customers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <a href={`/customers/${customer.id}`} className="font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">{customer.name}</a>
                        <div className="flex flex-col gap-0.5 text-xs text-gray-400">
                          {customer.phone && <span>{customer.phone}</span>}
                          {customer.email && <span>{customer.email}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{customer._count.invoices}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-emerald-600">{fmt(customer.totalInvoiced)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-amber-600">{fmt(customer.outstanding)}</td>
                  <td className="px-6 py-4">
                    <a href={`/customers/${customer.id}`} className="text-xs font-medium text-[var(--accent)] hover:underline">View Profile</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full border border-[var(--border)] shadow-2xl p-6 relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 hover:scale-110 transition-transform"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">Add Customer</h3>
            <p className="text-sm text-gray-400 mb-6">Create a billing profile for your new customer.</p>

            {formError && (
              <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-sm rounded-xl flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 px-1">Customer / Company Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 px-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +91 9999999999"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 px-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. billing@acme.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 px-1">Billing Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Street, Landmark, City, Pin"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 px-1">State Name</label>
                  <input
                    type="text"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 px-1">State Code</label>
                  <input
                    type="text"
                    value={stateCode}
                    onChange={e => setStateCode(e.target.value)}
                    placeholder="e.g. 27"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 px-1">GSTIN</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={e => setGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 27AAAAA0000A1Z0"
                  maxLength={15}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] text-sm font-mono"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-[var(--border)] bg-white dark:bg-gray-800 text-[var(--foreground)] hover:bg-gray-50 text-sm font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
