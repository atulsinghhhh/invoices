"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewExpensePage() {
  const [vendorName, setVendorName] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("OTHER");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = { vendorName, amount: Number(amount), date, category };
    const res = await fetch("/api/(expenses)/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      router.push("/expenses");
    } else {
      const d = await res.json();
      alert(d.error || "Failed to create expense");
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold mb-4">New expense</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-sm">
        <label className="block mb-2 text-sm">Vendor</label>
        <input value={vendorName} onChange={(e) => setVendorName(e.target.value)} className="w-full mb-3 border px-3 py-2 rounded" />
        <label className="block mb-2 text-sm">Amount</label>
        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full mb-3 border px-3 py-2 rounded" />
        <label className="block mb-2 text-sm">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full mb-3 border px-3 py-2 rounded" />
        <label className="block mb-2 text-sm">Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full mb-4 border px-3 py-2 rounded">
          <option>OTHER</option>
          <option>FOOD_BEVERAGE</option>
          <option>TRAVEL</option>
          <option>OFFICE_SUPPLIES</option>
        </select>

        <button className="px-4 py-2 bg-gray-900 text-white rounded">Save</button>
      </form>
    </div>
  );
}
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ExpenseCategory,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  autoCategory,
  fmtINR,
} from "../categories";

type OcrResult = {
  vendorName: string;
  amount: number;
  date: string;
  gstNumber: string | null;
  gstPaid: number | null;
  category: ExpenseCategory;
};

type Step = "choose" | "scanning" | "form";

const TODAY = new Date().toISOString().split("T")[0];

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][];

export default function AddExpensePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("choose");
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const [vendorName, setVendorName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(TODAY);
  const [category, setCategory] = useState<ExpenseCategory>("OTHER");
  const [gstNumber, setGstNumber] = useState("");
  const [gstPaid, setGstPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [ocrFilled, setOcrFilled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setReceiptPreview(previewUrl);
    setStep("scanning");

    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/expenses/ocr", { method: "POST", body: fd });
      if (!res.ok) throw new Error("OCR failed");
      const data: OcrResult = await res.json();
      setVendorName(data.vendorName);
      setAmount(String(data.amount));
      setDate(data.date);
      setCategory(data.category);
      setGstNumber(data.gstNumber ?? "");
      setGstPaid(data.gstPaid ? String(data.gstPaid) : "");
      setOcrFilled(true);
      setStep("form");
    } catch {
      setError("Could not read receipt. Please fill in manually.");
      setStep("form");
    }
  }

  function handleVendorBlur() {
    if (vendorName && !ocrFilled) {
      setCategory(autoCategory(vendorName));
    }
  }

  function handleManual() {
    setOcrFilled(false);
    setStep("form");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorName || !amount || !date) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName,
          amount: Number(amount),
          date,
          category,
          gstNumber: gstNumber || undefined,
          gstPaid: gstPaid ? Number(gstPaid) : undefined,
          receiptImageUrl: receiptPreview || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push("/expenses");
    } catch {
      setError("Failed to save expense. Please try again.");
      setSubmitting(false);
    }
  }

  if (step === "choose") {
    return (
      <MobileShell>
        <div className="flex flex-col h-full">
          <TopBar title="Add Expense" onBack={() => router.push("/expenses")} />
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 pb-10">
            <div className="text-center mb-4">
              <p className="text-gray-500 text-sm">How would you like to add this expense?</p>
            </div>

            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center gap-3 p-6 rounded-2xl bg-indigo-600 text-white shadow-lg active:scale-[0.98] transition-transform"
            >
              <span className="text-5xl">📷</span>
              <span className="text-xl font-semibold">Scan Receipt</span>
              <span className="text-indigo-200 text-sm text-center">
                Take a photo — we&apos;ll extract the details automatically
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={handleManual}
              className="w-full flex flex-col items-center gap-3 p-6 rounded-2xl bg-white border-2 border-gray-200 text-gray-800 shadow-sm active:scale-[0.98] transition-transform"
            >
              <span className="text-5xl">✏️</span>
              <span className="text-xl font-semibold">Enter Manually</span>
              <span className="text-gray-400 text-sm">Fill in the details yourself</span>
            </button>
          </div>
        </div>
      </MobileShell>
    );
  }

  if (step === "scanning") {
    return (
      <MobileShell>
        <div className="flex flex-col h-full items-center justify-center gap-6 px-6">
          {receiptPreview && (
            <div className="relative w-56 h-72 rounded-2xl overflow-hidden shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={receiptPreview} alt="Receipt" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-indigo-900/40 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          )}
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800">Scanning receipt…</p>
            <p className="text-sm text-gray-500 mt-1">Extracting vendor, amount &amp; GST details</p>
          </div>
        </div>
      </MobileShell>
    );
  }

  // step === "form"
  const hasGst = !!gstNumber || !!gstPaid;

  return (
    <MobileShell>
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <TopBar
          title={ocrFilled ? "Review & Confirm" : "Add Expense"}
          onBack={() => setStep("choose")}
        />

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">
          {ocrFilled && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl">
              <span className="text-green-600 text-lg">✓</span>
              <p className="text-green-700 text-sm font-medium">Receipt scanned — review and confirm below</p>
            </div>
          )}

          {receiptPreview && (
            <div className="rounded-2xl overflow-hidden h-40 w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={receiptPreview} alt="Receipt" className="w-full h-full object-cover" />
            </div>
          )}

          {error && (
            <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <Field label="Vendor / Merchant">
            <input
              type="text"
              required
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              onBlur={handleVendorBlur}
              placeholder="e.g. Swiggy, Amazon, Airtel"
              className={inputCls(ocrFilled && !!vendorName)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (₹)">
              <input
                type="number"
                inputMode="decimal"
                required
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={inputCls(ocrFilled && !!amount)}
              />
            </Field>
            <Field label="Date">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls(ocrFilled && !!date)}
              />
            </Field>
          </div>

          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className={`${inputCls(ocrFilled && category !== "OTHER")} appearance-none`}
            >
              {CATEGORIES.map(([val, label]) => (
                <option key={val} value={val}>
                  {CATEGORY_ICONS[val]} {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Vendor GST Number (optional)">
            <input
              type="text"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
              placeholder="e.g. 27AAACR5055K1Z5"
              maxLength={15}
              className={inputCls(ocrFilled && !!gstNumber)}
            />
          </Field>

          {(gstNumber || hasGst) && (
            <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-indigo-600 font-semibold text-sm">🧾 Input Tax Credit (ITC)</span>
                {gstPaid && (
                  <span className="ml-auto text-indigo-700 font-bold text-sm">{fmtINR(Number(gstPaid))}</span>
                )}
              </div>
              <Field label="GST Paid (ITC eligible)">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={gstPaid}
                  onChange={(e) => setGstPaid(e.target.value)}
                  placeholder="GST amount on invoice"
                  className={inputCls(ocrFilled && !!gstPaid)}
                />
              </Field>
              {amount && gstPaid && (
                <p className="text-xs text-indigo-600">
                  Effective cost after ITC: {fmtINR(Number(amount) - Number(gstPaid))}
                </p>
              )}
            </div>
          )}

          <Field label="Notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details…"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </Field>
        </div>

        <div className="sticky bottom-0 px-4 py-4 bg-white border-t border-gray-100">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-indigo-600 text-white text-base font-semibold shadow-lg active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Log Expense"}
          </button>
        </div>
      </form>
    </MobileShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function inputCls(highlighted = false) {
  return `w-full px-4 py-3 rounded-xl border text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors ${highlighted ? "border-green-400 bg-green-50" : "border-gray-200"
    }`;
}

function TopBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 bg-white">
      <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 className="text-base font-semibold text-gray-900">{title}</h1>
    </div>
  );
}

function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-sm bg-white min-h-screen flex flex-col relative overflow-hidden shadow-xl">
        {children}
      </div>
    </div>
  );
}
