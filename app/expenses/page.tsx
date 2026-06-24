import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/api/auth/signin");

  const business = await prisma.business.findUnique({
    where: { userId: Number(session.user.id) }
  });
  if (!business) redirect("/setup");

  // Get start of current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [expenses, monthlyAgg] = await Promise.all([
    prisma.expense.findMany({
      where: { businessId: business.id },
      orderBy: { date: 'desc' },
      take: 50,
    }),
    prisma.expense.aggregate({
      where: { businessId: business.id, date: { gte: startOfMonth } },
      _sum: { amount: true }
    }),
  ]);

  const monthlyTotal = monthlyAgg._sum.amount || 0;
  const fmt = (n: number) => `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const categories = [
    'All', 'FOOD_BEVERAGE', 'TRAVEL', 'ACCOMMODATION', 'OFFICE_SUPPLIES',
    'UTILITIES', 'MARKETING', 'PROFESSIONAL_SERVICES', 'EQUIPMENT',
    'RENT', 'SALARY', 'TAX', 'INSURANCE', 'MAINTENANCE', 'ENTERTAINMENT', 'OTHER'
  ];

  return (
    <div className="flex flex-col flex-1 max-w-7xl mx-auto w-full pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Expenses</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track and categorize your business expenses.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-full shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Record Expense
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search vendor"
            className="pl-9 pr-4 py-2.5 w-full rounded-xl border border-[var(--border)] bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        <select className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-gray-600 dark:text-gray-300">
          {categories.map(c => (
            <option key={c}>{c === 'All' ? 'Category: All' : c.replace(/_/g, ' ')}</option>
          ))}
        </select>
        {/* Monthly total badge */}
        <div className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-gray-700 text-white rounded-xl shadow-sm">
          <span className="text-xs font-medium opacity-70">This month&apos;s total</span>
          <span className="text-sm font-bold">{fmt(monthlyTotal)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--surface)] backdrop-blur rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        {expenses.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <p className="text-lg font-medium mb-2">No expenses recorded yet</p>
            <p className="text-sm">Start tracking your business expenses.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)] bg-gray-50/60 dark:bg-gray-800/40">
                {['Vendor', 'Category', 'Date', 'Amount', 'GST Paid'].map(h => (
                  <th key={h} className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-[var(--foreground)]">{exp.vendorName}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {exp.category.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{exp.date.toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-[var(--foreground)]">{fmt(exp.amount)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {exp.gstPaid != null ? fmt(exp.gstPaid) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
