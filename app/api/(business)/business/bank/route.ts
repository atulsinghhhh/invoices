import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { bankName, accountNo, ifscCode, accountHolderName } = await req.json();
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
        reminderDays: 7,
      },
      update: {
        bankName,
        accountNo,
        ifscCode,
        accountHolderName,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error updating bank details:", error);
    return NextResponse.json({ error: "Failed to update bank details" }, { status: 500 });
  }
}
