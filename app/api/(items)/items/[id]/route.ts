import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const itemId = Number(id);
    if (Number.isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const body = await req.json();
    const { itemName, unitPrice, gstRate } = body;

    // Check if the item belongs to this business
    const existing = await prisma.itemCatalog.findFirst({
      where: { id: itemId, businessId: business.id }
    });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // If changing name, ensure uniqueness
    if (itemName && itemName.trim() !== existing.itemName) {
      const duplicate = await prisma.itemCatalog.findFirst({
        where: { businessId: business.id, itemName: itemName.trim() }
      });
      if (duplicate) {
        return NextResponse.json({ error: "An item with this name already exists" }, { status: 400 });
      }
    }

    // Update item
    const updated = await prisma.itemCatalog.update({
      where: { id: itemId },
      data: {
        ...(itemName !== undefined && { itemName: itemName.trim() }),
        ...(unitPrice !== undefined && { unitPrice: Number(unitPrice) }),
        ...(gstRate !== undefined && { gstRate: Number(gstRate) }),
      }
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
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
    const itemId = Number(id);
    if (Number.isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    // Check if the item belongs to this business
    const existing = await prisma.itemCatalog.findFirst({
      where: { id: itemId, businessId: business.id }
    });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Delete item
    await prisma.itemCatalog.delete({
      where: { id: itemId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
