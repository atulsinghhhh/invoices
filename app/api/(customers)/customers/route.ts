import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const { searchParams } = req.nextUrl;
    const search = searchParams.get("q");

    const customers = await prisma.customer.findMany({
      where: {
        businessId: business.id,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
          ],
        }),
      },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { invoices: true } },
        invoices: {
          select: { grandTotal: true, status: true },
        },
      },
    });

    const enriched = customers.map((c) => {
      const totalInvoiced = c.invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
      const outstanding = c.invoices
        .filter((inv) => ["SENT", "OVERDUE", "VIEWED"].includes(inv.status))
        .reduce((sum, inv) => sum + inv.grandTotal, 0);
      const { invoices: _, ...rest } = c;
      void _;
      return { ...rest, totalInvoiced, outstanding };
    });

    return NextResponse.json({ customers: enriched });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const { name, phone, gstin, state, stateCode } = await req.json();
    if (!name || !phone) {
      return NextResponse.json({ error: "name and phone are required" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: { businessId: business.id, name, phone, gstin, state, stateCode },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
