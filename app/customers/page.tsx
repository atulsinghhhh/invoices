import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function CustomersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/api/auth/signin");

  const business = await prisma.business.findUnique({
    where: { userId: Number(session.user.id) }
  });
  if (!business) redirect("/setup");

  const customers = await prisma.customer.findMany({
    where: { businessId: business.id },
    include: {
      invoices: {
        select: { grandTotal: true, status: true }
      }
    }
  });

  const fmt = (n: number) => `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col flex-1 max-w-7xl mx-auto w-full pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Customers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your clients and billing relationships.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-full shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search customers"
            className="pl-9 pr-4 py-2.5 w-full rounded-xl border border-[var(--border)] bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--surface)] backdrop-blur rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        {customers.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <p className="text-lg font-medium mb-2">No customers yet</p>
            <p className="text-sm">Add your first customer to get started.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)] bg-gray-50/60 dark:bg-gray-800/40">
                {['Customer', 'Invoices', 'Total Revenue', 'Outstanding', ''].map((h, i) => (
                  <th key={i} className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {customers.map(customer => {
                const total = customer.invoices.reduce((s, i) => s + i.grandTotal, 0);
                const outstanding = customer.invoices
                  .filter(i => ['SENT', 'VIEWED', 'OVERDUE'].includes(i.status))
                  .reduce((s, i) => s + i.grandTotal, 0);
                return (
                  <tr key={customer.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <a href={`/customers/${customer.id}`} className="font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">{customer.name}</a>
                          <p className="text-xs text-gray-400">{customer.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{customer.invoices.length}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-600">{fmt(total)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-amber-600">{fmt(outstanding)}</td>
                    <td className="px-6 py-4">
                      <a href={`/customers/${customer.id}`} className="text-xs font-medium text-[var(--accent)] hover:underline">View →</a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
