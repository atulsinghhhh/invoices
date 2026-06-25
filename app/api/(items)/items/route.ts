import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const { searchParams } = req.nextUrl;
    const search = searchParams.get("q");

    const items = await prisma.itemCatalog.findMany({
      where: {
        businessId: business.id,
        ...(search && { itemName: { contains: search, mode: "insensitive" } }),
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, itemName: true, unitPrice: true, gstRate: true },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const body = await req.json();
    const { itemName, unitPrice = 0, gstRate = 0 } = body;

    if (!itemName?.trim()) {
      return NextResponse.json({ error: "itemName is required" }, { status: 400 });
    }

    const item = await prisma.itemCatalog.upsert({
      where: {
        businessId_itemName: {
          businessId: business.id,
          itemName: itemName.trim()
        }
      },
      create: {
        businessId: business.id,
        itemName: itemName.trim(),
        unitPrice: Number(unitPrice),
        gstRate: Number(gstRate)
      },
      update: {
        unitPrice: Number(unitPrice),
        gstRate: Number(gstRate)
      }
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}

