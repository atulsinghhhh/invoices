"use client";

import { useState } from "react";

type Customer = { id: number; name: string };
type CatalogItem = { id: number; itemName: string; unitPrice: number | null; gstRate: number | null };
type LineItem = { id: number; description: string; qty: number; unitPrice: number; gstRate: number };

export default function InvoiceBuilderClient({
  customers,
  catalog,
  nextInvoiceNumber,
  today,
}: {
  customers: Customer[];
  catalog: CatalogItem[];
  nextInvoiceNumber: string;
  today: string;
}) {
  const [items, setItems] = useState<LineItem[]>([
    { id: 1, description: '', qty: 1, unitPrice: 0, gstRate: 18 }
  ]);

  const addItem = () => {
    setItems(prev => [...prev, { id: Date.now(), description: '', qty: 1, unitPrice: 0, gstRate: 18 }]);
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (id: number, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const totalGst = items.reduce((s, i) => s + (i.qty * i.unitPrice * i.gstRate) / 100, 0);
  const grandTotal = subtotal + totalGst;

  const fmt = (n: number) => `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col flex-1 max-w-6xl mx-auto w-full pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <a href="/invoices" className="text-sm text-gray-500 hover:text-[var(--accent)] transition-colors flex items-center gap-1 mb-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Invoices
          </a>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Create Invoice</h1>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 border border-[var(--border)] bg-[var(--surface)] hover:bg-gray-50 dark:hover:bg-gray-800 text-[var(--foreground)] text-sm font-semibold rounded-full transition-colors">
            Save Draft
          </button>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-full shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send
          </button>
        </div>
      </div>

      {/* Customer + meta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[var(--surface)] backdrop-blur rounded-2xl border border-[var(--border)] shadow-sm p-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Customer</label>
          <select className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)]">
            <option value="">Select a customer…</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="bg-[var(--surface)] backdrop-blur rounded-2xl border border-[var(--border)] shadow-sm p-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Invoice details</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">Invoice #</p>
              <input type="text" defaultValue={nextInvoiceNumber} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Date</p>
              <input type="date" defaultValue={today} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Due date</p>
              <input type="date" className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-[var(--surface)] backdrop-blur rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Items</h3>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border)] bg-gray-50/60 dark:bg-gray-800/40">
              {['Item', 'Quantity', 'Unit Price', 'GST %', 'Amount', 'Total', ''].map((h, i) => (
                <th key={i} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {items.map(item => {
              const amount = item.qty * item.unitPrice;
              const total = amount + (amount * item.gstRate) / 100;
              return (
                <tr key={item.id}>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Item description"
                      list="catalog-items"
                      className="w-full px-3 py-2 rounded-lg border border-transparent hover:border-[var(--border)] focus:border-[var(--accent)] bg-transparent outline-none text-sm"
                    />
                    <datalist id="catalog-items">
                      {catalog.map(c => <option key={c.id} value={c.itemName} />)}
                    </datalist>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={item.qty}
                      min={1}
                      onChange={e => updateItem(item.id, 'qty', Number(e.target.value))}
                      className="w-20 px-3 py-2 rounded-lg border border-transparent hover:border-[var(--border)] focus:border-[var(--accent)] bg-transparent outline-none text-sm text-right"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={item.unitPrice}
                      min={0}
                      onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                      className="w-28 px-3 py-2 rounded-lg border border-transparent hover:border-[var(--border)] focus:border-[var(--accent)] bg-transparent outline-none text-sm text-right"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={item.gstRate}
                      onChange={e => updateItem(item.id, 'gstRate', Number(e.target.value))}
                      className="w-20 px-3 py-2 rounded-lg border border-transparent hover:border-[var(--border)] focus:border-[var(--accent)] bg-transparent outline-none text-sm"
                    >
                      {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 text-right">{fmt(amount)}</td>
                  <td className="px-4 py-2 text-sm font-semibold text-[var(--foreground)] text-right">{fmt(total)}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-rose-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-6 py-3 border-t border-[var(--border)] bg-gray-50/40 dark:bg-gray-800/20">
          <button
            onClick={addItem}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add item
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex justify-end">
        <div className="w-80 bg-[var(--surface)] backdrop-blur rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-3">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Subtotal</span>
            <span className="font-medium text-[var(--foreground)]">{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>GST</span>
            <span className="font-medium text-[var(--foreground)]">{fmt(totalGst)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-[var(--foreground)] pt-3 border-t border-[var(--border)]">
            <span>Grand Total</span>
            <span className="text-[var(--accent)]">{fmt(grandTotal)}</span>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-full transition-colors">Save Draft</button>
            <button className="flex-1 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-full transition-colors">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
