import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/api/auth/signin");

  const business = await prisma.business.findUnique({
    where: { userId: Number(session.user.id) }
  });

  if (!business) redirect("/setup");

  const [invoices, totalInvoices, aggregates, outstandingAgg, overdueAgg] = await Promise.all([
    prisma.invoice.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { customer: true }
    }),
    prisma.invoice.count({ where: { businessId: business.id } }),
    prisma.invoice.aggregate({
      where: { businessId: business.id },
      _sum: { grandTotal: true }
    }),
    prisma.invoice.aggregate({
      where: { businessId: business.id, status: { in: ['SENT', 'VIEWED', 'OVERDUE'] } },
      _sum: { grandTotal: true }
    }),
    prisma.invoice.aggregate({
      where: { businessId: business.id, status: 'OVERDUE' },
      _sum: { grandTotal: true }
    }),
  ]);

  const totalRevenue = aggregates._sum.grandTotal || 0;
  const outstanding = outstandingAgg._sum.grandTotal || 0;
  const overdue = overdueAgg._sum.grandTotal || 0;

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
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {business.legalName || 'Your business'} · Dashboard
          </p>
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {[
          { label: 'Outstanding', value: fmt(outstanding), sub: 'Awaiting payment', color: 'text-amber-600' },
          { label: 'Total Revenue', value: fmt(totalRevenue), sub: 'All time', color: 'text-emerald-600' },
          { label: 'Overdue', value: fmt(overdue), sub: 'Action required', color: 'text-rose-600' },
          { label: 'Total Invoices', value: String(totalInvoices), sub: 'Created', color: 'text-indigo-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-[var(--surface)] backdrop-blur p-6 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md transition-all">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color} truncate`}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent invoices */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--foreground)]">Recent invoices</h2>
          <a href="/invoices" className="text-sm font-medium text-[var(--accent)] hover:underline">View all →</a>
        </div>
        <div className="bg-[var(--surface)] backdrop-blur rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
          {invoices.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-lg font-medium mb-2">No invoices yet</p>
              <p className="text-sm mb-4">Create your first invoice to get started.</p>
              <a href="/invoices/new" className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-full text-sm font-medium">
                + Create Invoice
              </a>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-gray-50/60 dark:bg-gray-800/40">
                  {['Invoice', 'Customer', 'Amount', 'Due', 'Status'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors group">
                    <td className="px-6 py-4">
                      <a href={`/invoices/${inv.id}`} className="font-semibold text-[var(--accent)] hover:underline">{inv.invoiceNumber}</a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{inv.customer.name}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-[var(--foreground)]">{fmt(inv.grandTotal)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{inv.dueDate.toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor(inv.status)}`}>{inv.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
