"use client";

export default function InvoiceViewClient({ invoiceId, status }: { invoiceId: number; status: string }) {
  return (
    <div className="flex items-center gap-2">
      {status !== 'PAID' && (
        <button
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-full transition-colors"
          onClick={() => alert('Mark as paid — implement via Server Action')}
        >
          Mark as Paid
        </button>
      )}
    </div>
  );
}
