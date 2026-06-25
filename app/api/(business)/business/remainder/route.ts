import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { reminderDays, defaultGstRate } = await req.json();
    const business = await prisma.business.findUnique({ where: { userId } });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const settings = await prisma.businessSettings.upsert({
      where: { businessId: business.id },
      create: {
        businessId: business.id,
        reminderDays: reminderDays ?? 7,
        defaultGstRate: defaultGstRate ?? undefined,
      },
      update: {
        reminderDays: reminderDays ?? 7,
        defaultGstRate: defaultGstRate ?? undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error updating reminder settings:", error);
    return NextResponse.json({ error: "Failed to update reminder settings" }, { status: 500 });
  }
}
