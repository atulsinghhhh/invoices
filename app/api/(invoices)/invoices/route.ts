import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@/app/generated/prisma/enums";

function calcGst(amount: number, gstRate: number, isInterstate: boolean) {
  const gstAmount = (amount * gstRate) / 100;
  if (isInterstate) return { cgst: 0, sgst: 0, igst: gstAmount };
  return { cgst: gstAmount / 2, sgst: gstAmount / 2, igst: 0 };
}

async function getBusinessForUser(userId: number) {
  return prisma.business.findUnique({ where: { userId } });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const business = await getBusinessForUser(userId);
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const { searchParams } = req.nextUrl;
    const statusFilter = searchParams.get("status") as InvoiceStatus | null;

    const where = {
      businessId: business.id,
      ...(statusFilter && { status: statusFilter }),
    };

    const [invoices, outstandingAgg] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true } },
          items: false,
        },
      }),
      prisma.invoice.aggregate({
        where: {
          businessId: business.id,
          status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE, InvoiceStatus.VIEWED] },
        },
        _sum: { grandTotal: true },
      }),
    ]);

    return NextResponse.json({
      invoices,
      totalOutstanding: outstandingAgg._sum.grandTotal ?? 0,
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const business = await getBusinessForUser(userId);
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const body = await req.json();
    const { customerId, invoiceDate, dueDate, notes, discount = 0, items, send = false } = body;

    if (!customerId || !dueDate || !items?.length) {
      return NextResponse.json({ error: "customerId, dueDate and items are required" }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({
      where: { id: Number(customerId), businessId: business.id },
    });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const isInterstate = !!customer.stateCode && customer.stateCode !== business.stateCode;

    // Generate sequential invoice number per business
    const count = await prisma.invoice.count({ where: { businessId: business.id } });
    const invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`;

    let subtotal = 0;
    let totalGst = 0;
    const computedItems = items.map((item: { itemName: string; quantity: number; unitPrice: number; gstRate?: number }) => {
      const amount = item.quantity * item.unitPrice;
      const gstRate = item.gstRate ?? 0;
      const { cgst, sgst, igst } = calcGst(amount, gstRate, isInterstate);
      const gstAmount = cgst + sgst + igst;
      subtotal += amount;
      totalGst += gstAmount;
      return { ...item, gstRate, amount, cgst, sgst, igst, totalAmount: amount + gstAmount };
    });

    const grandTotal = subtotal + totalGst - discount;
    const status = send ? InvoiceStatus.SENT : InvoiceStatus.DRAFT;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        businessId: business.id,
        customerId: customer.id,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        dueDate: new Date(dueDate),
        status,
        notes,
        discount,
        subtotal,
        totalGst,
        grandTotal,
        isInterstate,
        sentAt: send ? new Date() : null,
        items: {
          create: computedItems.map((item: {
            itemName: string; quantity: number; unitPrice: number;
            gstRate: number; amount: number; cgst: number; sgst: number;
            igst: number; totalAmount: number;
          }) => ({
            itemName: item.itemName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            gstRate: item.gstRate,
            amount: item.amount,
            cgst: item.cgst,
            sgst: item.sgst,
            igst: item.igst,
            totalAmount: item.totalAmount,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    // Upsert item catalog for autocomplete
    await Promise.all(
      computedItems.map((item: { itemName: string; unitPrice: number; gstRate: number }) =>
        prisma.itemCatalog.upsert({
          where: { businessId_itemName: { businessId: business.id, itemName: item.itemName } },
          create: { businessId: business.id, itemName: item.itemName, unitPrice: item.unitPrice, gstRate: item.gstRate },
          update: { unitPrice: item.unitPrice, gstRate: item.gstRate },
        })
      )
    );

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
