import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const customer = await prisma.customer.findFirst({
      where: { id: Number(id), businessId: business.id },
      include: {
        invoices: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            dueDate: true,
            grandTotal: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const totalInvoiced = customer.invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const outstanding = customer.invoices
      .filter((inv) => ["SENT", "OVERDUE", "VIEWED"].includes(inv.status))
      .reduce((sum, inv) => sum + inv.grandTotal, 0);

    return NextResponse.json({ customer, totalInvoiced, outstanding });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const existing = await prisma.customer.findFirst({
      where: { id: Number(id), businessId: business.id },
    });
    if (!existing) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const { name, phone, gstin, state, stateCode } = await req.json();
    const customer = await prisma.customer.update({
      where: { id: existing.id },
      data: { name, phone, gstin, state, stateCode, updatedAt: new Date() },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}
