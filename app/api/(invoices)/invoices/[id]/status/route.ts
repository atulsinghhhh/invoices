import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["DRAFT", "SENT", "VIEWED", "PAID", "OVERDUE"] as const;
type InvoiceStatusValue = typeof VALID_STATUSES[number];

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

    const { status } = await req.json();
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }

    const existing = await prisma.invoice.findFirst({
      where: { id: Number(id), businessId: business.id },
    });
    if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const timestampField: Partial<Record<"sentAt" | "viewedAt" | "paidAt", Date>> = {};
    if (status === "SENT" && !existing.sentAt) timestampField.sentAt = new Date();
    if (status === "VIEWED" && !existing.viewedAt) timestampField.viewedAt = new Date();
    if (status === "PAID" && !existing.paidAt) timestampField.paidAt = new Date();

    const invoice = await prisma.invoice.update({
      where: { id: existing.id },
      data: { status: status as InvoiceStatusValue, ...timestampField, updatedAt: new Date() },
    });

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Error updating invoice status:", error);
    return NextResponse.json({ error: "Failed to update invoice status" }, { status: 500 });
  }
}
