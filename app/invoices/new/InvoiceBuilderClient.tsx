"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Customer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  state: string | null;
  stateCode: string | null;
}

type CatalogItem = { id: number; itemName: string; unitPrice: number | null; gstRate: number | null };
type LineItem = { id: number; description: string; qty: number; unitPrice: number; gstRate: number };

export default function InvoiceBuilderClient({
  customers,
  catalog,
  nextInvoiceNumber,
  businessStateCode,
  today,
}: {
  customers: Customer[];
  catalog: CatalogItem[];
  nextInvoiceNumber: string;
  businessStateCode: string;
  today: string;
}) {
  const router = useRouter();

  // Wizard Step State
  const [step, setStep] = useState(1);

  // Form states
  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Line items state
  const [items, setItems] = useState<LineItem[]>([
    { id: 1, description: '', qty: 1, unitPrice: 0, gstRate: 18 }
  ]);

  const selectedCustomer = customers.find(c => String(c.id) === customerId);

  // Interstate detection: compares customer stateCode against business stateCode
  const isInterstate = !!selectedCustomer?.stateCode && selectedCustomer.stateCode !== businessStateCode;

  const addItem = () => {
    setItems(prev => [...prev, { id: Date.now(), description: '', qty: 1, unitPrice: 0, gstRate: 18 }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const updateItem = (id: number, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  // Autocomplete catalog match
  const handleDescriptionChange = (id: number, value: string) => {
    updateItem(id, 'description', value);
    const matched = catalog.find(c => c.itemName.toLowerCase() === value.toLowerCase());
    if (matched) {
      if (matched.unitPrice !== null) {
        updateItem(id, 'unitPrice', matched.unitPrice);
      }
      if (matched.gstRate !== null) {
        updateItem(id, 'gstRate', matched.gstRate);
      }
    }
  };

  // Calculations
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const totalGst = items.reduce((s, i) => s + (i.qty * i.unitPrice * i.gstRate) / 100, 0);
  const grandTotal = Math.max(0, subtotal + totalGst - discount);

  // Submit to API
  const handleSubmit = async (send: boolean) => {
    if (!customerId) {
      setError("Please select a customer.");
      setStep(1);
      return;
    }
    if (!dueDate) {
      setError("Please select a due date.");
      setStep(2);
      return;
    }
    if (items.some(item => !item.description.trim() || item.qty <= 0 || item.unitPrice < 0)) {
      setError("Please ensure all items have descriptions, valid quantity, and unit prices.");
      setStep(3);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: Number(customerId),
          invoiceDate,
          dueDate,
          notes,
          discount,
          send,
          items: items.map(i => ({
            itemName: i.description,
            quantity: i.qty,
            unitPrice: i.unitPrice,
            gstRate: i.gstRate,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save invoice");
      }

      router.push(`/invoices/${data.invoice.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create invoice.");
      setSubmitting(false);
    }
  };

  const fmt = (n: number) => `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Navigation handlers
  const handleNext = () => {
    setError(null);
    if (step === 1 && !customerId) {
      setError("Please select a customer before proceeding.");
      return;
    }
    if (step === 2 && !dueDate) {
      setError("Please specify a due date.");
      return;
    }
    if (step === 3 && items.some(i => !i.description.trim() || i.qty <= 0 || i.unitPrice < 0)) {
      setError("Please ensure all items have valid descriptions, quantities, and unit prices.");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  return (
    <div className="flex flex-col flex-1 max-w-6xl mx-auto w-full pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <a href="/invoices" className="text-sm text-gray-500 hover:text-[var(--accent)] transition-colors flex items-center gap-1 mb-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Invoices
          </a>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Create Invoice</h1>
        </div>
      </div>

      {/* Progress Steps bar */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl border border-[var(--border)] mb-8 shadow-sm overflow-x-auto gap-4">
        {[
          { num: 1, label: "Customer Selection" },
          { num: 2, label: "Details & Dates" },
          { num: 3, label: "Invoice Items" },
          { num: 4, label: "PDF Preview" },
          { num: 5, label: "Save & Send" },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-3 shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
              step === s.num
                ? "bg-[var(--accent)] text-white"
                : step > s.num
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                : "bg-gray-100 dark:bg-gray-700 text-gray-400"
            }`}>
              {step > s.num ? "✓" : s.num}
            </div>
            <span className={`text-xs font-semibold ${step === s.num ? "text-[var(--foreground)]" : "text-gray-400"}`}>
              {s.label}
            </span>
            {s.num < 5 && <div className="w-8 h-px bg-gray-200 dark:bg-gray-700" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-sm rounded-xl flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Wizard Content Cards */}
      <div className="flex-1 min-h-[400px]">
        {/* Step 1: Customer Selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="md:col-span-2 bg-[var(--surface)] backdrop-blur rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">Choose Customer</label>
                <select
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] text-sm font-medium"
                >
                  <option value="">Select a customer from table…</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {selectedCustomer && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-[var(--border)] rounded-2xl space-y-3">
                  <h3 className="text-sm font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-2 mb-2">Customer Billing Profile</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-400 mb-0.5">Customer Name</p>
                      <p className="font-semibold text-[var(--foreground)]">{selectedCustomer.name}</p>
                    </div>
                    {selectedCustomer.phone && (
                      <div>
                        <p className="text-gray-400 mb-0.5">Phone Number</p>
                        <p className="font-medium text-[var(--foreground)]">{selectedCustomer.phone}</p>
                      </div>
                    )}
                    {selectedCustomer.email && (
                      <div>
                        <p className="text-gray-400 mb-0.5">Email Address</p>
                        <p className="font-medium text-[var(--foreground)]">{selectedCustomer.email}</p>
                      </div>
                    )}
                    {selectedCustomer.gstin && (
                      <div>
                        <p className="text-gray-400 mb-0.5">GSTIN</p>
                        <p className="font-mono font-bold text-[var(--foreground)]">{selectedCustomer.gstin}</p>
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div className="col-span-2">
                        <p className="text-gray-400 mb-0.5">Address</p>
                        <p className="font-medium text-[var(--foreground)]">{selectedCustomer.address}</p>
                      </div>
                    )}
                    {selectedCustomer.state && (
                      <div>
                        <p className="text-gray-400 mb-0.5">Billing State</p>
                        <p className="font-semibold text-[var(--foreground)]">
                          {selectedCustomer.state} {selectedCustomer.stateCode ? `(${selectedCustomer.stateCode})` : ""}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Step 1 Sidebar: Interstate Check */}
            <div className="bg-[var(--surface)] backdrop-blur rounded-2xl border border-[var(--border)] shadow-sm p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-[var(--foreground)] border-b border-[var(--border)] pb-2 mb-4">Interstate Flag Check</h3>
                {!selectedCustomer ? (
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Select a customer to dynamically verify if billing is Same-State (CGST + SGST) or Interstate (IGST).
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🌍</div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Your State Code</p>
                        <p className="text-sm font-bold text-[var(--foreground)]">{businessStateCode || "Not Set"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">📍</div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Client State Code</p>
                        <p className="text-sm font-bold text-[var(--foreground)]">{selectedCustomer.stateCode || "Not Provided"}</p>
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
                      isInterstate
                        ? "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300"
                        : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                    }`}>
                      <span className="text-base">{isInterstate ? "✈️" : "🏠"}</span>
                      <div>
                        <p className="uppercase text-[9px] tracking-wider opacity-75">Calculated Tax Split</p>
                        <p className="text-xs mt-0.5">
                          {isInterstate ? "Interstate Transaction (IGST)" : "Same-State Transaction (CGST + SGST)"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-6 pt-4 border-t border-[var(--border)]">
                Can&apos;t find customer? Create them on the <a href="/customers" className="text-[var(--accent)] hover:underline font-bold">Customers Page</a>.
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Details & Dates */}
        {step === 2 && (
          <div className="bg-[var(--surface)] backdrop-blur rounded-2xl border border-[var(--border)] shadow-sm p-8 max-w-2xl mx-auto space-y-6 animate-[fadeIn_0.2s_ease-out]">
            <h3 className="text-lg font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-2 mb-4">Invoice Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 px-1">Auto-generated Invoice Number</label>
                <input
                  type="text"
                  disabled
                  value={nextInvoiceNumber}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-gray-100 dark:bg-gray-800 text-sm font-mono text-gray-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-gray-400 mt-1 px-1">Atomic tracking managed via InvoiceSequence schema.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 px-1">Invoice Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={e => setInvoiceDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 px-1">Payment Due Date *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] text-sm font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Invoice Items */}
        {step === 3 && (
          <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-[var(--surface)] backdrop-blur rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)]">
                <h3 className="font-semibold text-[var(--foreground)]">Line Items</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-gray-50/60 dark:bg-gray-800/40">
                      {['Item Description', 'Qty', 'Unit Price', 'GST Rate', 'Base Amount', 'Calculated GST', 'Total', ''].map((h, i) => (
                        <th key={i} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${i >= 4 && i <= 6 ? "text-right" : ""}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {items.map(item => {
                      const amount = item.qty * item.unitPrice;
                      const gstAmount = (amount * item.gstRate) / 100;
                      const total = amount + gstAmount;
                      return (
                        <tr key={item.id}>
                          <td className="px-3 py-2 w-1/3">
                            <input
                              type="text"
                              required
                              value={item.description}
                              onChange={e => handleDescriptionChange(item.id, e.target.value)}
                              placeholder="Type item description..."
                              list="catalog-items"
                              className="w-full px-3 py-2.5 rounded-xl border border-transparent hover:border-[var(--border)] focus:border-[var(--accent)] bg-transparent outline-none text-sm text-[var(--foreground)]"
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
                              className="w-16 px-2 py-2 rounded-xl border border-transparent hover:border-[var(--border)] focus:border-[var(--accent)] bg-transparent outline-none text-sm text-right text-[var(--foreground)]"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item.unitPrice}
                              min={0}
                              onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                              className="w-24 px-2 py-2 rounded-xl border border-transparent hover:border-[var(--border)] focus:border-[var(--accent)] bg-transparent outline-none text-sm text-right text-[var(--foreground)] font-mono"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={item.gstRate}
                              onChange={e => updateItem(item.id, 'gstRate', Number(e.target.value))}
                              className="w-20 px-2 py-2 rounded-xl border border-transparent hover:border-[var(--border)] focus:border-[var(--accent)] bg-transparent outline-none text-sm text-[var(--foreground)]"
                            >
                              {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500 text-right font-mono">{fmt(amount)}</td>
                          <td className="px-4 py-2 text-xs text-gray-500 text-right">
                            <div className="font-mono">{fmt(gstAmount)}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5 font-sans">
                              {isInterstate ? (
                                <span>IGST ({item.gstRate}%)</span>
                              ) : (
                                <span>CGST/SGST ({(item.gstRate / 2)}% ea)</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm font-semibold text-[var(--foreground)] text-right font-mono">{fmt(total)}</td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => removeItem(item.id)}
                              disabled={items.length <= 1}
                              className="text-gray-300 hover:text-rose-500 transition-colors disabled:opacity-30 cursor-pointer"
                            >
                              <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 border-t border-[var(--border)] bg-gray-50/40 dark:bg-gray-800/20">
                <button
                  onClick={addItem}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add line item
                </button>
              </div>
            </div>

            {/* Calculations Breakdown summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-[var(--surface)] backdrop-blur rounded-2xl border border-[var(--border)] shadow-sm p-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Notes / Payment Terms (Optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Bank Account details, UPI, payment instructions..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] text-sm resize-none"
                />
              </div>

              <div className="bg-[var(--surface)] backdrop-blur rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-3.5">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[var(--foreground)] font-mono">{fmt(subtotal)}</span>
                </div>
                
                {/* Dynamically broken down GST */}
                {!isInterstate ? (
                  <>
                    <div className="flex justify-between text-xs text-gray-500 pl-2">
                      <span>CGST (Central)</span>
                      <span className="font-medium text-[var(--foreground)] font-mono">{fmt(totalGst / 2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 pl-2">
                      <span>SGST (State)</span>
                      <span className="font-medium text-[var(--foreground)] font-mono">{fmt(totalGst / 2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-xs text-gray-500 pl-2">
                    <span>IGST (Integrated)</span>
                    <span className="font-medium text-[var(--foreground)] font-mono">{fmt(totalGst)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 pt-1">
                  <span>Discount</span>
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={e => setDiscount(Math.max(0, Number(e.target.value)))}
                    className="w-24 px-2 py-1.5 rounded-lg border border-[var(--border)] bg-transparent text-right text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] text-[var(--foreground)] font-mono"
                  />
                </div>
                <div className="flex justify-between text-lg font-bold text-[var(--foreground)] pt-3 border-t border-[var(--border)]">
                  <span>Grand Total</span>
                  <span className="text-[var(--accent)] font-mono">{fmt(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Preview Block (Puppeteer Miniature HTML Letterhead) */}
        {step === 4 && (
          <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 px-1">Document PDF Preview</h3>
            
            {/* The Miniature Page Preview */}
            <div className="bg-white text-gray-800 rounded-3xl border border-[var(--border)] shadow-xl p-8 max-w-4xl mx-auto font-sans">
              <div className="border-b border-gray-200 pb-6 mb-6 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight uppercase">INVOICE</h2>
                  <p className="text-xs text-gray-400 mt-1">Invoice Number: <span className="font-bold text-gray-700">{nextInvoiceNumber}</span></p>
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-sm text-indigo-700">BILLING SENDER</h3>
                  <p className="text-xs text-gray-500 mt-1">Status: <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 rounded-full text-gray-600 uppercase">DRAFT</span></p>
                </div>
              </div>

              {/* Billing metadata */}
              <div className="grid grid-cols-2 gap-8 mb-8 text-xs leading-relaxed">
                <div>
                  <p className="font-bold text-gray-400 uppercase tracking-wider mb-1.5">BILLED TO</p>
                  <p className="font-bold text-gray-900 text-sm">{selectedCustomer?.name}</p>
                  {selectedCustomer?.address && <p className="text-gray-500 mt-0.5">{selectedCustomer.address}</p>}
                  {selectedCustomer?.state && <p className="text-gray-500">{selectedCustomer.state} ({selectedCustomer.stateCode})</p>}
                  {selectedCustomer?.gstin && <p className="text-gray-700 font-semibold font-mono mt-1">GSTIN: {selectedCustomer.gstin}</p>}
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-400 uppercase tracking-wider mb-1.5">INVOICE METADATA</p>
                  <p className="text-gray-500">Invoice Date: <span className="font-medium text-gray-900">{new Date(invoiceDate).toLocaleDateString('en-IN')}</span></p>
                  <p className="text-gray-500">Payment Due: <span className="font-bold text-gray-900">{new Date(dueDate).toLocaleDateString('en-IN')}</span></p>
                  <p className="text-gray-500 mt-1">Tax Split Applied: <span className="font-semibold text-indigo-600">{isInterstate ? "Integrated (IGST)" : "Same-State (CGST/SGST)"}</span></p>
                </div>
              </div>

              {/* Items Preview Table */}
              <table className="w-full text-left text-xs mb-8">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50 text-gray-600">
                    <th className="px-3 py-2 font-bold uppercase">Item Description</th>
                    <th className="px-3 py-2 text-right font-bold uppercase w-12">Qty</th>
                    <th className="px-3 py-2 text-right font-bold uppercase w-20">Rate</th>
                    <th className="px-3 py-2 text-right font-bold uppercase w-16">GST %</th>
                    <th className="px-3 py-2 text-right font-bold uppercase">Base Amt</th>
                    <th className="px-3 py-2 text-right font-bold uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(item => {
                    const base = item.qty * item.unitPrice;
                    const gst = (base * item.gstRate) / 100;
                    return (
                      <tr key={item.id} className="text-gray-700">
                        <td className="px-3 py-2.5 font-medium">{item.description || "Unspecified Item"}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{item.qty}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{fmt(item.unitPrice)}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{item.gstRate}%</td>
                        <td className="px-3 py-2.5 text-right font-mono text-gray-500">{fmt(base)}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold">{fmt(base + gst)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Preview Totals */}
              <div className="flex justify-end text-xs">
                <div className="w-64 space-y-2 border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-mono text-gray-900">{fmt(subtotal)}</span>
                  </div>
                  {!isInterstate ? (
                    <>
                      <div className="flex justify-between text-gray-500 pl-2">
                        <span>CGST (Central GST)</span>
                        <span className="font-mono text-gray-900">{fmt(totalGst / 2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500 pl-2">
                        <span>SGST (State GST)</span>
                        <span className="font-mono text-gray-900">{fmt(totalGst / 2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-gray-500 pl-2">
                      <span>IGST (Integrated GST)</span>
                      <span className="font-mono text-gray-900">{fmt(totalGst)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Discount</span>
                      <span className="font-mono text-rose-600">- {fmt(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
                    <span>Grand Total</span>
                    <span className="text-indigo-700 font-mono">{fmt(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Preview Notes */}
              {notes.trim() && (
                <div className="mt-8 border-t border-gray-100 pt-4 text-left">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Notes & terms</p>
                  <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">{notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Save & Send */}
        {step === 5 && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm p-8 max-w-xl mx-auto text-center space-y-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
              ✉️
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-[var(--foreground)]">Finalize & Send Invoice</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Confirm your billing preferences. When sending, the invoice status changes to <span className="font-semibold text-indigo-600 dark:text-indigo-400">SENT</span> and payment reminder logs are automatically generated.
              </p>
            </div>

            {/* Reminder Alert Banner */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl text-left text-xs space-y-2">
              <p className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <span>🔔</span> Payment Reminders Active
              </p>
              <p className="text-amber-700 dark:text-amber-400 leading-relaxed">
                We will schedule automatic reminders inside the database to execute at **+7 days** and **+14 days** from the invoice&apos;s specified due date ({new Date(dueDate).toLocaleDateString('en-IN')}) to help you track unpaid payments.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="flex-1 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-xl text-sm transition-all shadow-md cursor-pointer"
              >
                {submitting ? "Sending..." : "Send Invoice Now"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons bottom bar */}
      <div className="mt-8 pt-4 border-t border-[var(--border)] flex justify-between">
        <button
          onClick={handleBack}
          disabled={step === 1 || submitting}
          className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--foreground)] hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Back
        </button>
        {step < 5 ? (
          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-xl cursor-pointer shadow transition-all active:scale-[0.98]"
          >
            Next
          </button>
        ) : (
          <div className="w-20" /> // spacer to balance bottom layout
        )}
      </div>
    </div>
  );
}
