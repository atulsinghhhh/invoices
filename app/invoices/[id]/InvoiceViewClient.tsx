"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InvoiceViewClient({ invoiceId, status }: { invoiceId: number; status: string }) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [loading, setLoading] = useState(false);

  const handleMarkAsPaid = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setCurrentStatus("PAID");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to mark invoice as paid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {currentStatus !== 'PAID' && (
        <button
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-full transition-colors cursor-pointer shadow-sm hover:shadow active:scale-[0.98]"
          onClick={handleMarkAsPaid}
        >
          {loading ? "Updating..." : "Mark as Paid"}
        </button>
      )}
      <button
        onClick={() => window.print()}
        className="px-4 py-2 border border-[var(--border)] bg-[var(--surface)] hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium rounded-full transition-colors cursor-pointer"
      >
        Print / PDF
      </button>
    </div>
  );
}
