import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function InvoicesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/api/auth/signin");

  const business = await prisma.business.findUnique({
    where: { userId: Number(session.user.id) }
  });
  if (!business) redirect("/setup");

  const [invoices, outstandingAgg] = await Promise.all([
    prisma.invoice.findMany({
      where: { businessId: business.id },
      orderBy: { invoiceDate: 'desc' },
      include: { customer: true }
    }),
    prisma.invoice.aggregate({
      where: { businessId: business.id, status: { in: ['SENT', 'VIEWED', 'OVERDUE'] } },
      _sum: { grandTotal: true }
    }),
  ]);

  const outstanding = outstandingAgg._sum.grandTotal || 0;
  const fmt = (n: number) => `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const statusColor = (s: string) => {
    switch (s) {
      case 'PAID': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'OVERDUE': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      case 'DRAFT': return 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    }
  };

  return (
    <div className="flex flex-col flex-1 max-w-7xl mx-auto w-full pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Invoices</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and track all your invoices.</p>
        </div>
        <a
          href="/invoices/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-full shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </a>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search invoices or customers"
            className="pl-9 pr-4 py-2.5 w-full rounded-xl border border-[var(--border)] bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        <select className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-gray-600 dark:text-gray-300">
          <option>Status: All</option>
          <option>DRAFT</option>
          <option>SENT</option>
          <option>PAID</option>
          <option>OVERDUE</option>
        </select>
        <input
          type="date"
          className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-gray-600 dark:text-gray-300"
        />
        {/* Outstanding total badge */}
        <div className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-gray-700 text-white rounded-xl shadow-sm">
          <span className="text-xs font-medium opacity-70">Total outstanding</span>
          <span className="text-sm font-bold">{fmt(outstanding)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--surface)] backdrop-blur rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        {invoices.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <p className="text-lg font-medium mb-2">No invoices yet</p>
            <a href="/invoices/new" className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-full text-sm font-medium mt-2">+ Create your first invoice</a>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)] bg-gray-50/60 dark:bg-gray-800/40">
                {['Invoice', 'Customer', 'Amount', 'Due', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <a href={`/invoices/${inv.id}`} className="font-semibold text-[var(--accent)] hover:underline">{inv.invoiceNumber}</a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{inv.customer.name}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-[var(--foreground)]">{fmt(inv.grandTotal)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{inv.dueDate.toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor(inv.status)}`}>{inv.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <a href={`/invoices/${inv.id}`} className="text-xs font-medium text-[var(--accent)] hover:underline">View</a>
                    </div>
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
