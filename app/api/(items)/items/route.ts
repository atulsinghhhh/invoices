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

    const items = await prisma.itemCatalog.findMany({
      where: {
        businessId: business.id,
        ...(search && { itemName: { contains: search, mode: "insensitive" } }),
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { itemName: true, unitPrice: true, gstRate: true },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}
