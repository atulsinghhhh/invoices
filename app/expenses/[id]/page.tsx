"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ExpenseCategory,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  fmtINR,
} from "../categories";

type Expense = {
  id: number;
  vendorName: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  gstNumber: string | null;
  gstPaid: number | null;
  receiptImageUrl: string | null;
  notes: string | null;
  createdAt: string;
};

export default function ExpenseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/expenses/${params.id}`)
      .then((r) => r.json())
      .then((d) => setExpense(d.expense ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleDelete() {
    if (!confirm("Delete this expense?")) return;
    setDeleting(true);
    await fetch(`/api/expenses/${params.id}`, { method: "DELETE" });
    router.push("/expenses");
  }

  if (loading) {
    return (
      <MobileShell>
        <div className="flex items-center justify-center flex-1">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileShell>
    );
  }

  if (!expense) {
    return (
      <MobileShell>
        <div className="flex flex-col items-center justify-center flex-1 px-8 text-center">
          <span className="text-5xl mb-3">🔍</span>
          <p className="text-gray-700 font-semibold">Expense not found</p>
          <button onClick={() => router.back()} className="mt-4 text-indigo-600 font-medium text-sm">
            Go back
          </button>
        </div>
      </MobileShell>
    );
  }

  const colorCls = CATEGORY_COLORS[expense.category];
  const icon = CATEGORY_ICONS[expense.category];
  const label = CATEGORY_LABELS[expense.category];

  return (
    <MobileShell>
      <div className="flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 bg-white">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-gray-900">Expense Detail</h1>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-full hover:bg-red-50 text-red-500 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-6">
          {/* Hero amount */}
          <div className="bg-white px-6 pt-6 pb-8 text-center border-b border-gray-100">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 ${colorCls}`}>
              {icon}
            </div>
            <p className="text-3xl font-bold text-gray-900">{fmtINR(expense.amount)}</p>
            <p className="text-gray-500 text-base mt-1">{expense.vendorName}</p>
            <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full ${colorCls}`}>
              {label}
            </span>
          </div>

          {/* Details */}
          <div className="px-4 pt-4 space-y-3">
            <DetailRow icon="📅" label="Date" value={new Date(expense.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} />
            <DetailRow icon="🏷️" label="Category" value={label} />

            {expense.gstNumber && (
              <DetailRow icon="🔢" label="Vendor GSTIN" value={expense.gstNumber} mono />
            )}

            {expense.gstPaid != null && (
              <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-indigo-600 text-base">🧾</span>
                  <span className="text-indigo-700 font-semibold text-sm">Input Tax Credit</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="text-xs text-indigo-400 mb-0.5">GST Paid</p>
                    <p className="font-bold text-indigo-700">{fmtINR(expense.gstPaid)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-indigo-400 mb-0.5">Net Cost</p>
                    <p className="font-bold text-indigo-700">{fmtINR(expense.amount - expense.gstPaid)}</p>
                  </div>
                </div>
              </div>
            )}

            {expense.notes && (
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Notes</p>
                <p className="text-gray-700 text-sm leading-relaxed">{expense.notes}</p>
              </div>
            )}

            {expense.receiptImageUrl && (
              <div className="rounded-2xl overflow-hidden border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-2">Receipt</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={expense.receiptImageUrl} alt="Receipt" className="w-full object-contain max-h-96" />
              </div>
            )}

            <p className="text-center text-xs text-gray-300 pt-2">
              Logged on {new Date(expense.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}

function DetailRow({ icon, label, value, mono }: { icon: string; label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 border border-gray-100">
      <span className="text-xl w-7 text-center flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
        <p className={`text-gray-900 text-sm font-medium truncate ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
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
