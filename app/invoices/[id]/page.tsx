"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type Invoice = any;

export default function InvoiceView() {
  const params = useParams() as { id: string };
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/(invoices)/invoices/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setInvoice(data.invoice ?? null);
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [params.id]);

  if (loading) return <div>Loading...</div>;
  if (!invoice) return <div>Invoice not found</div>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold mb-4">{invoice.invoiceNumber}</h1>
      <div className="bg-white p-6 rounded shadow-sm">
        <div className="mb-4">To: {invoice.customer?.name}</div>
        <div className="mb-4">Date: {new Date(invoice.invoiceDate).toLocaleDateString()}</div>
        <table className="w-full text-sm mb-4">
          <thead className="text-left text-gray-600">
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it: any) => (
              <tr key={it.id} className="border-t">
                <td className="py-2">{it.itemName}</td>
                <td className="py-2">{it.quantity}</td>
                <td className="py-2">₹ {it.unitPrice}</td>
                <td className="py-2 text-right">₹ {it.totalAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-right font-medium">Grand total: ₹ {invoice.grandTotal}</div>
      </div>
    </div>
  );
}
