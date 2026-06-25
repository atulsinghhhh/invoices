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
    const { bankName, accountNo, ifscCode, accountHolderName, defaultGstRate, reminderDays } = await req.json();
    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const settings = await prisma.businessSettings.upsert({
      where: { businessId: business.id },
      create: {
        businessId: business.id,
        bankName,
        accountNo,
        ifscCode,
        accountHolderName,
        defaultGstRate: defaultGstRate ?? undefined,
        reminderDays: reminderDays ?? 7,
      },
      update: {
        bankName,
        accountNo,
        ifscCode,
        accountHolderName,
        defaultGstRate: defaultGstRate ?? undefined,
        reminderDays: reminderDays ?? 7,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error saving business settings:", error);
    return NextResponse.json({ error: "Failed to save business settings" }, { status: 500 });
  }
}
