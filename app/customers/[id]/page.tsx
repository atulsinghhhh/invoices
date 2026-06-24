import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/api/auth/signin");

  const business = await prisma.business.findUnique({
    where: { userId: Number(session.user.id) }
  });
  if (!business) redirect("/setup");

  const customer = await prisma.customer.findUnique({
    where: { id: Number(id), businessId: business.id },
    include: {
      invoices: {
        orderBy: { invoiceDate: 'desc' },
      }
    }
  });

  if (!customer) {
    return <div className="p-8 text-center text-gray-400">Customer not found.</div>;
  }

  const fmt = (n: number) => `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalRevenue = customer.invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const outstanding = customer.invoices
    .filter(inv => ['SENT', 'VIEWED', 'OVERDUE'].includes(inv.status))
    .reduce((sum, inv) => sum + inv.grandTotal, 0);

  const statusColor = (s: string) => {
    switch (s) {
      case 'PAID': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'OVERDUE': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      case 'DRAFT': return 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full pt-4">
      {/* Back */}
      <a href="/customers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--accent)] transition-colors mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Customers
      </a>

      <h1 className="text-3xl font-bold text-[var(--foreground)] mb-6">Customer Profile</h1>

      {/* Customer meta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-[var(--surface)] backdrop-blur rounded-2xl border border-[var(--border)] shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-2xl">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">{customer.name}</h2>
              <p className="text-sm text-gray-500">Phone: {customer.phone}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {customer.gstin && (
              <div><p className="text-xs text-gray-400 mb-0.5">GSTIN</p><p className="font-medium text-[var(--foreground)]">{customer.gstin}</p></div>
            )}
            {customer.state && (
              <div><p className="text-xs text-gray-400 mb-0.5">State</p><p className="font-medium text-[var(--foreground)]">{customer.state} ({customer.stateCode})</p></div>
            )}
          </div>
        </div>

        <div className="bg-[var(--surface)] backdrop-blur rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Total Invoices</p>
            <p className="text-2xl font-bold text-[var(--foreground)]">{customer.invoices.length}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Total Revenue</p>
            <p className="text-xl font-bold text-emerald-600">{fmt(totalRevenue)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Outstanding</p>
            <p className="text-xl font-bold text-amber-600">{fmt(outstanding)}</p>
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-[var(--surface)] backdrop-blur rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Invoices</h3>
        </div>
        {customer.invoices.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No invoices for this customer yet.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)] bg-gray-50/60 dark:bg-gray-800/40">
                {['Invoice #', 'Date', 'Amount', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {customer.invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <a href={`/invoices/${inv.id}`} className="font-semibold text-[var(--accent)] hover:underline">{inv.invoiceNumber}</a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{inv.invoiceDate.toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-[var(--foreground)]">{fmt(inv.grandTotal)}</td>
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
  );
}
