"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewInvoicePage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [itemsCatalog, setItemsCatalog] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [lines, setLines] = useState<any[]>([{ itemName: "", quantity: 1, unitPrice: 0, gstRate: 0 }]);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/(customers)/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []));
    fetch("/api/(items)/items")
      .then((r) => r.json())
      .then((d) => setItemsCatalog(d.items ?? []));
  }, []);

  function updateLine(idx: number, patch: Partial<any>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { itemName: "", quantity: 1, unitPrice: 0, gstRate: 0 }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) return alert("Select a customer");
    setSending(true);
    const body = {
      customerId: Number(customerId),
      dueDate: new Date().toISOString(),
      notes,
      items: lines,
    };
    try {
      const res = await fetch("/api/(invoices)/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        router.push(`/invoices/${data.invoice.id}`);
      } else {
        alert(data.error || "Failed to create invoice");
      }
    } catch (err) {
      alert("Unexpected error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold mb-4">New invoice</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-sm">
        <label className="block mb-2">Customer</label>
        <select value={customerId ?? ""} onChange={(e) => setCustomerId(e.target.value)} className="w-full mb-4 border px-3 py-2 rounded">
          <option value="">Select customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div className="mb-4">
          <label className="block mb-2">Items</label>
          <div className="space-y-2">
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <input className="col-span-6 border px-2 py-1 rounded" value={line.itemName} onChange={(e) => updateLine(idx, { itemName: e.target.value })} placeholder="Item name" />
                <input type="number" className="col-span-2 border px-2 py-1 rounded" value={line.quantity} onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })} />
                <input type="number" className="col-span-2 border px-2 py-1 rounded" value={line.unitPrice} onChange={(e) => updateLine(idx, { unitPrice: Number(e.target.value) })} />
                <input type="number" className="col-span-2 border px-2 py-1 rounded" value={line.gstRate} onChange={(e) => updateLine(idx, { gstRate: Number(e.target.value) })} />
              </div>
            ))}
          </div>
          <button type="button" onClick={addLine} className="mt-2 px-3 py-1 bg-gray-100 rounded">Add line</button>
        </div>

        <label className="block mb-2">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full mb-4 border px-3 py-2 rounded" />

        <div className="flex gap-2">
          <button disabled={sending} className="px-4 py-2 bg-gray-900 text-white rounded">{sending ? "Saving..." : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
