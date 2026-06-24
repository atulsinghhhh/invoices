"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function CustomerProfile() {
  const params = useParams() as { id: string };
  const [customer, setCustomer] = useState<any | null>(null);

  useEffect(() => {
    fetch(`/api/(customers)/customers/${params.id}`)
      .then((r) => r.json())
      .then((d) => setCustomer(d.customer ?? null));
  }, [params.id]);

  if (!customer) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold mb-4">{customer.name}</h1>
      <div className="bg-white p-6 rounded shadow-sm">
        <div>Phone: {customer.phone}</div>
        <div className="mt-4">Total invoiced: ₹ {customer.totalInvoiced ?? 0}</div>
        <div>Outstanding: ₹ {customer.outstanding ?? 0}</div>
      </div>
    </div>
  );
}
