import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const invoice = await prisma.invoice.findFirst({
      where: { id: Number(id), businessId: business.id },
      include: {
        customer: true,
        items: true,
        business: { select: { tradeName: true, legalName: true, gstin: true, address: true, state: true, settings: true } },
      },
    });

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const existing = await prisma.invoice.findFirst({
      where: { id: Number(id), businessId: business.id },
    });
    if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (existing.status !== "DRAFT") {
      return NextResponse.json({ error: "Only DRAFT invoices can be edited" }, { status: 400 });
    }

    const body = await req.json();
    const { invoiceDate, dueDate, notes, discount = 0, items } = body;

    const customer = await prisma.customer.findFirst({
      where: { id: existing.customerId, businessId: business.id },
    });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const isInterstate = !!customer.stateCode && customer.stateCode !== business.stateCode;

    let subtotal = 0;
    let totalGst = 0;
    const computedItems = (items ?? []).map((item: { itemName: string; quantity: number; unitPrice: number; gstRate?: number }) => {
      const amount = item.quantity * item.unitPrice;
      const gstRate = item.gstRate ?? 0;
      const gstAmount = (amount * gstRate) / 100;
      const cgst = isInterstate ? 0 : gstAmount / 2;
      const sgst = isInterstate ? 0 : gstAmount / 2;
      const igst = isInterstate ? gstAmount : 0;
      subtotal += amount;
      totalGst += gstAmount;
      return { itemName: item.itemName, quantity: item.quantity, unitPrice: item.unitPrice, gstRate, amount, cgst, sgst, igst, totalAmount: amount + gstAmount };
    });

    const grandTotal = subtotal + totalGst - discount;

    // Delete old items and recreate
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: existing.id } });

    const invoice = await prisma.invoice.update({
      where: { id: existing.id },
      data: {
        invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes,
        discount,
        subtotal,
        totalGst,
        grandTotal,
        isInterstate,
        updatedAt: new Date(),
        items: { create: computedItems },
      },
      include: { items: true, customer: true },
    });

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}
