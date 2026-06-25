import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import InvoiceBuilderClient from "./InvoiceBuilderClient";

export default async function InvoiceBuilderPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/api/auth/signin");

  const business = await prisma.business.findUnique({
    where: { userId: Number(session.user.id) }
  });
  if (!business) redirect("/setup");

  const [customers, catalog] = await Promise.all([
    prisma.customer.findMany({ where: { businessId: business.id } }),
    prisma.itemCatalog.findMany({ where: { businessId: business.id } }),
  ]);

  // Compute next invoice number using InvoiceSequence
  const sequence = await prisma.invoiceSequence.findUnique({
    where: { businessId: business.id }
  });
  const nextNumber = sequence
    ? `${sequence.prefix}-${String(sequence.nextValue).padStart(4, '0')}`
    : 'INV-0001';

  return (
    <InvoiceBuilderClient
      customers={customers}
      catalog={catalog}
      nextInvoiceNumber={nextNumber}
      businessStateCode={business.stateCode}
      today={new Date().toISOString().split('T')[0]}
    />
  );
}
