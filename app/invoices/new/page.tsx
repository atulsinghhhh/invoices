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

  // Compute next invoice number
  const lastInvoice = await prisma.invoice.findFirst({
    where: { businessId: business.id },
    orderBy: { id: 'desc' },
    select: { invoiceNumber: true }
  });

  let nextNumber = 'INV-0001';
  if (lastInvoice?.invoiceNumber) {
    const match = lastInvoice.invoiceNumber.match(/(\d+)$/);
    if (match) {
      nextNumber = `INV-${String(Number(match[1]) + 1).padStart(4, '0')}`;
    }
  }

  return (
    <InvoiceBuilderClient
      customers={customers}
      catalog={catalog}
      nextInvoiceNumber={nextNumber}
      today={new Date().toISOString().split('T')[0]}
    />
  );
}
