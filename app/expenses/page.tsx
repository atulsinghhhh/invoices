"use client";
import React, { useEffect, useState } from "react";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/(expenses)/expenses")
      .then((r) => r.json())
      .then((d) => setExpenses(d.expenses ?? []));
  }, []);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Expenses</h1>
        <a href="/expenses/new" className="px-3 py-2 bg-gray-900 text-white rounded">New expense</a>
      </div>
      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Vendor</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-right px-4 py-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="px-4 py-3">{e.vendorName}</td>
                <td className="px-4 py-3">{e.category}</td>
                <td className="px-4 py-3">{new Date(e.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">₹ {e.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ExpenseCategory,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  fmtINR,
} from "./categories";

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
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as ExpenseCategory[];

export default function ExpenseListPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [monthlyItc, setMonthlyItc] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ExpenseCategory | null>(null);

  const now = new Date();
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  async function fetchExpenses(cat?: ExpenseCategory | null) {
    setLoading(true);
    try {
      const url = new URL("/api/expenses", window.location.origin);
      if (cat) url.searchParams.set("category", cat);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setExpenses(data.expenses ?? []);
      setMonthlyTotal(data.monthlyTotal ?? 0);
      setMonthlyItc(data.monthlyItc ?? 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchExpenses(); }, []);

  function handleCategoryFilter(cat: ExpenseCategory) {
    const next = activeCategory === cat ? null : cat;
    setActiveCategory(next);
    fetchExpenses(next);
  }

  const grouped = groupByDate(expenses);

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-sm bg-gray-50 min-h-screen flex flex-col relative shadow-xl">

        {/* Header */}
        <div className="bg-indigo-600 px-5 pt-12 pb-6 text-white">
          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-1">Expenses</p>
          <h1 className="text-2xl font-bold mb-4">{monthLabel}</h1>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Spent" value={fmtINR(monthlyTotal)} />
            <StatCard label="ITC Captured" value={fmtINR(monthlyItc)} accent />
          </div>
        </div>

        {/* Category filter chips */}
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <FilterChip
              label="All"
              active={activeCategory === null}
              onClick={() => handleCategoryFilter(activeCategory!)}
              icon="🏷️"
            />
            {ALL_CATEGORIES.map((cat) => (
              <FilterChip
                key={cat}
                label={CATEGORY_LABELS[cat]}
                icon={CATEGORY_ICONS[cat]}
                active={activeCategory === cat}
                onClick={() => handleCategoryFilter(cat)}
              />
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto pb-28">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : expenses.length === 0 ? (
            <EmptyState />
          ) : (
            grouped.map(({ label, items }) => (
              <section key={label}>
                <div className="px-5 pt-5 pb-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
                </div>
                <div className="space-y-2 px-4">
                  {items.map((exp) => (
                    <ExpenseRow key={exp.id} expense={exp} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        {/* FAB */}
        <Link
          href="/expenses/new"
          className="fixed bottom-6 right-1/2 translate-x-[calc(50%-1.5rem)] w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xl text-3xl active:scale-95 transition-transform"
          style={{ boxShadow: "0 4px 24px rgba(99,102,241,0.5)" }}
        >
          <span className="leading-none pb-0.5">+</span>
        </Link>
      </div>
    </div>
  );
}

function ExpenseRow({ expense }: { expense: Expense }) {
  const colorCls = CATEGORY_COLORS[expense.category] ?? "bg-gray-100 text-gray-600";
  const icon = CATEGORY_ICONS[expense.category] ?? "📋";
  const label = CATEGORY_LABELS[expense.category] ?? expense.category;

  return (
    <Link href={`/expenses/${expense.id}`}>
      <div className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 active:bg-gray-50 transition-colors shadow-sm border border-gray-100">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${colorCls}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{expense.vendorName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${colorCls}`}>{label}</span>
            {expense.gstPaid && (
              <span className="text-[10px] font-medium text-indigo-600">ITC ✓</span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-gray-900 text-sm">{fmtINR(expense.amount)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </p>
        </div>
      </div>
    </Link>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-3 ${accent ? "bg-white/20" : "bg-white/10"}`}>
      <p className="text-indigo-200 text-[11px] font-medium mb-0.5">{label}</p>
      <p className={`font-bold text-lg leading-tight ${accent ? "text-white" : "text-white"}`}>{value}</p>
    </div>
  );
}

function FilterChip({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${active
          ? "bg-indigo-600 text-white shadow-sm"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <span className="text-6xl mb-4">🧾</span>
      <p className="text-gray-700 font-semibold text-lg">No expenses yet</p>
      <p className="text-gray-400 text-sm mt-1">Tap the + button to log your first expense</p>
    </div>
  );
}

function groupByDate(expenses: Expense[]): { label: string; items: Expense[] }[] {
  const map = new Map<string, Expense[]>();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  for (const exp of expenses) {
    const d = new Date(exp.date);
    let label: string;
    if (isSameDay(d, today)) label = "Today";
    else if (isSameDay(d, yesterday)) label = "Yesterday";
    else label = d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });

    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(exp);
  }

  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}
