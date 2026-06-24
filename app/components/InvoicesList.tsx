"use client";
import React, { useEffect, useState } from "react";

type Invoice = {
    id: number;
    invoiceNumber: string;
    customer: { name: string } | null;
    grandTotal: number;
    dueDate: string;
    status: string;
};

export default function InvoicesList() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        fetch("/api/(invoices)/invoices")
            .then((r) => r.json())
            .then((data) => {
                if (!mounted) return;
                setInvoices(data.invoices ?? []);
            })
            .catch(() => { })
            .finally(() => mounted && setLoading(false));
        return () => {
            mounted = false;
        };
    }, []);

    if (loading) return <div className="text-sm text-gray-500">Loading...</div>;

    return (
        <div className="bg-white shadow-sm rounded-md overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                    <tr>
                        <th className="text-left px-4 py-3">Invoice</th>
                        <th className="text-left px-4 py-3">Customer</th>
                        <th className="text-right px-4 py-3">Amount</th>
                        <th className="text-left px-4 py-3">Due</th>
                        <th className="text-left px-4 py-3">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {invoices.map((inv) => (
                        <tr key={inv.id} className="border-t border-gray-100">
                            <td className="px-4 py-3 text-gray-800">{inv.invoiceNumber}</td>
                            <td className="px-4 py-3 text-gray-600">{inv.customer?.name ?? "—"}</td>
                            <td className="px-4 py-3 text-right font-medium">₹ {inv.grandTotal}</td>
                            <td className="px-4 py-3 text-gray-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{inv.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
