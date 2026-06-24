"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/(customers)/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []));
  }, []);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <Link href="/customers/new" className="px-3 py-2 bg-gray-900 text-white rounded">New customer</Link>
      </div>
      <div className="grid gap-3">
        {customers.map((c) => (
          <Link key={c.id} href={`/customers/${c.id}`} className="p-4 bg-white rounded shadow-sm flex justify-between">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-gray-600">{c.phone}</div>
            </div>
            <div className="text-sm text-gray-700">Outstanding: ₹ {c.outstanding}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
