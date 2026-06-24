import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getBusinessForUser(userId: number) {
  return prisma.business.findUnique({ where: { userId } });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const business = await getBusinessForUser(userId);
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const vendor = searchParams.get("vendor");

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      businessId: business.id,
      ...(category && { category }),
      ...(vendor && { vendorName: { contains: vendor, mode: "insensitive" } }),
      ...(from || to
        ? {
          date: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }
        : {}),
    };

    const [expenses, monthlyAgg, itcAgg] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: "desc" },
      }),
      prisma.expense.aggregate({
        where: { businessId: business.id, date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { businessId: business.id, date: { gte: monthStart, lte: monthEnd }, gstPaid: { not: null } },
        _sum: { gstPaid: true },
      }),
    ]);

    return NextResponse.json({
      expenses,
      monthlyTotal: monthlyAgg._sum.amount ?? 0,
      monthlyItc: itcAgg._sum.gstPaid ?? 0,
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const business = await getBusinessForUser(userId);
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const body = await req.json();
    const { vendorName, amount, date, category, gstNumber, gstPaid, receiptImageUrl, notes } = body;

    if (!vendorName || !amount || !date) {
      return NextResponse.json({ error: "vendorName, amount and date are required" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        businessId: business.id,
        vendorName,
        amount: Number(amount),
        date: new Date(date),
        category: category ?? "OTHER",
        gstNumber: gstNumber || null,
        gstPaid: gstPaid ? Number(gstPaid) : null,
        receiptImageUrl: receiptImageUrl || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
