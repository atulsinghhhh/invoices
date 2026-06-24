
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import InvoiceViewClient from "./InvoiceViewClient";

export default async function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/api/auth/signin");

  const business = await prisma.business.findUnique({
    where: { userId: Number(session.user.id) }
  });
  if (!business) redirect("/setup");

  const invoice = await prisma.invoice.findUnique({
    where: { id: Number(id), businessId: business.id },
    include: {
      customer: true,
      items: true,
    }
  });

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400">
        <p>Invoice not found.</p>
      </div>
    );
  }

  const fmt = (n: number) => `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="max-w-4xl mx-auto w-full pt-4">
      {/* Actions bar */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <a href="/invoices" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--accent)] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Invoices
        </a>
        <div className="flex gap-3">
          <InvoiceViewClient invoiceId={invoice.id} status={invoice.status} />
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-[var(--border)] bg-[var(--surface)] hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium rounded-full transition-colors"
          >
            Print / PDF
          </button>
        </div>
      </div>

      {/* Invoice document */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[var(--border)] shadow-sm p-10 print:shadow-none print:border-0">
        {/* From / To */}
        <div className="flex justify-between mb-10">
          <div>
            <p className="text-2xl font-extrabold text-[var(--foreground)] mb-1">INVOICE</p>
            <p className="text-sm text-gray-500">From: <span className="font-medium text-[var(--foreground)]">{business.legalName || business.tradeName || 'Your Business'}</span></p>
            <p className="text-sm text-gray-500">To: <span className="font-medium text-[var(--foreground)]">{invoice.customer.name}</span></p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Invoice <span className="font-semibold text-[var(--foreground)]">{invoice.invoiceNumber}</span></p>
            <p className="text-sm text-gray-500">Date: <span className="font-medium">{invoice.invoiceDate.toLocaleDateString('en-IN')}</span></p>
            <p className="text-sm text-gray-500">Due: <span className="font-medium">{invoice.dueDate.toLocaleDateString('en-IN')}</span></p>
          </div>
        </div>

        {/* Meta box */}
        <div className="grid grid-cols-2 gap-6 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-[var(--border)] mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Bill To</p>
            <p className="font-semibold text-[var(--foreground)]">{invoice.customer.name}</p>
            {invoice.customer.gstin && <p className="text-sm text-gray-500">GSTIN: {invoice.customer.gstin}</p>}
            {invoice.customer.state && <p className="text-sm text-gray-500">{invoice.customer.state}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">From</p>
            <p className="font-semibold text-[var(--foreground)]">{business.legalName || 'Your Business'}</p>
            <p className="text-sm text-gray-500">{business.address}</p>
            {business.gstin && <p className="text-sm text-gray-500">GSTIN: {business.gstin}</p>}
          </div>
        </div>

        {/* Line items */}
        <div className="rounded-xl border border-[var(--border)] overflow-hidden mb-8">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-[var(--border)]">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Item</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Qty</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Unit Price</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">GST %</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Amount</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {invoice.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-4 text-sm font-medium text-[var(--foreground)]">{item.itemName}</td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 text-right">{item.quantity}</td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 text-right">{fmt(item.unitPrice)}</td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 text-right">{item.gstRate}%</td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 text-right">{fmt(item.amount)}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-[var(--foreground)] text-right">{fmt(item.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-72 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-[var(--border)] p-5 space-y-3">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span className="font-medium text-[var(--foreground)]">{fmt(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>GST</span>
              <span className="font-medium text-[var(--foreground)]">{fmt(invoice.totalGst)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Discount</span>
                <span className="font-medium text-rose-600">- {fmt(invoice.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-[var(--foreground)] pt-3 border-t border-[var(--border)]">
              <span>Grand Total</span>
              <span>{fmt(invoice.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-8 pt-6 border-t border-[var(--border)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
