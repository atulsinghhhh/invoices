"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Item {
  id: number;
  itemName: string;
  unitPrice: number | null;
  gstRate: number | null;
}

export default function ItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [itemName, setItemName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [gstRate, setGstRate] = useState("18"); // Default 18%

  // Toast / Notification status
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  function triggerToast(text: string, type: "success" | "error" = "success") {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  }

  // Fetch catalog items
  async function fetchItems(query = "") {
    try {
      const url = query ? `/api/items?q=${encodeURIComponent(query)}` : "/api/items";
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
      if (data.items) {
        setItems(data.items);
      }
    } catch (err) {
      console.error("Failed to load catalog items:", err);
      triggerToast("Failed to retrieve items catalog", "error");
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    fetchItems();
  }, [router]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchItems(searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Open modal for Adding
  function handleOpenAdd() {
    setSelectedItem(null);
    setItemName("");
    setUnitPrice("");
    setGstRate("18");
    setFormError(null);
    setShowAddEditModal(true);
  }

  // Open modal for Editing
  function handleOpenEdit(item: Item) {
    setSelectedItem(item);
    setItemName(item.itemName);
    setUnitPrice(item.unitPrice !== null ? String(item.unitPrice) : "");
    setGstRate(item.gstRate !== null ? String(item.gstRate) : "0");
    setFormError(null);
    setShowAddEditModal(true);
  }

  // Open confirmation modal for deleting
  function handleOpenDelete(item: Item) {
    setSelectedItem(item);
    setShowDeleteModal(true);
  }

  // Form submission (Add/Edit)
  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName.trim()) {
      setFormError("Item name is required.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      itemName: itemName.trim(),
      unitPrice: unitPrice.trim() !== "" ? Number(unitPrice) : 0,
      gstRate: gstRate.trim() !== "" ? Number(gstRate) : 0,
    };

    try {
      let res;
      if (selectedItem) {
        // Edit flow
        res = await fetch(`/api/items/${selectedItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Add flow
        res = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save item details");
      }

      triggerToast(selectedItem ? "Item updated successfully!" : "New item created successfully!");
      setShowAddEditModal(false);
      fetchItems(searchQuery);
    } catch (err: any) {
      setFormError(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  }

  // Confirm delete item
  async function handleDeleteConfirm() {
    if (!selectedItem) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/items/${selectedItem.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete item");
      }

      triggerToast("Item removed from catalog");
      setShowDeleteModal(false);
      fetchItems(searchQuery);
    } catch (err: any) {
      triggerToast(err.message || "Could not delete item", "error");
    } finally {
      setDeleting(false);
    }
  }

  const fmt = (n: number) => `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col flex-1 max-w-7xl mx-auto w-full pt-4 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-[100] px-5 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all duration-300 animate-slide-in flex items-center gap-2 ${
          toastMessage.type === "success" 
            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" 
            : "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
        }`}>
          <div className={`w-2 h-2 rounded-full ${toastMessage.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`} />
          {toastMessage.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Items Catalog</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your catalog of items and services with standard GST rates and default prices.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-full shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
      </div>

      {/* Search filter */}
      <div className="mb-5">
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search items by name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2.5 w-full rounded-xl border border-[var(--border)] bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] shadow-xs"
          />
        </div>
      </div>

      {/* Table/List Container */}
      <div className="bg-[var(--surface)] backdrop-blur rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm">Fetching catalog list...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <p className="text-lg font-medium mb-2">No items found</p>
            <p className="text-sm">Click &quot;Add Item&quot; above to add a product or service catalog entry.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)] bg-gray-50/60 dark:bg-gray-800/40">
                {['Item / Service Name', 'Default Price', 'GST Rate', 'Actions'].map((h, i) => (
                  <th key={i} className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-700 dark:text-violet-300 font-bold text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <span className="font-semibold text-[var(--foreground)]">{item.itemName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {item.unitPrice !== null ? fmt(item.unitPrice) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      item.gstRate === 18 
                        ? "bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                        : item.gstRate === 12
                        ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        : item.gstRate === 5
                        ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        : "bg-gray-50 dark:bg-gray-950/20 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800"
                    }`}>
                      {item.gstRate ?? 0}% GST
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleOpenDelete(item)}
                        className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full border border-[var(--border)] shadow-2xl p-6 relative">
            <button
              onClick={() => setShowAddEditModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 hover:scale-110 transition-transform"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">
              {selectedItem ? "Edit Item / Service" : "Add Item to Catalog"}
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              {selectedItem 
                ? "Modify default specifications and prices for autocomplete." 
                : "Create a default specification and pricing catalog entry."}
            </p>

            {formError && (
              <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-sm rounded-xl flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 px-1">Item / Service Name *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  placeholder="e.g. Graphic Design Consultancy"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 px-1">Default Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPrice}
                    onChange={e => setUnitPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 px-1">GST Rate (%)</label>
                  <select
                    value={gstRate}
                    onChange={e => setGstRate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] text-sm"
                  >
                    <option value="0">0% (Nil Rated / Exempt)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                    <option value="28">28% GST</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="flex-1 py-2.5 border border-[var(--border)] bg-white dark:bg-gray-800 text-[var(--foreground)] hover:bg-gray-50 text-sm font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Saving..." : selectedItem ? "Update Item" : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full border border-[var(--border)] shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Delete Catalog Item</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete <span className="font-semibold text-[var(--foreground)]">{selectedItem?.itemName}</span> from your catalog? This action is permanent and cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 border border-[var(--border)] bg-white dark:bg-gray-800 text-[var(--foreground)] hover:bg-gray-50 text-sm font-semibold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {deleting ? "Deleting..." : "Delete Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
