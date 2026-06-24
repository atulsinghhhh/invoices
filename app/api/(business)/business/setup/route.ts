import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { gstin, state, address, registrationType, stateCode, legalName, tradeName, logoUrl } = await req.json();

    if (!gstin) {
      return NextResponse.json({ error: "GSTIN is required" }, { status: 400 });
    }
    if (gstin.length !== 15) {
      return NextResponse.json({ error: "GSTIN must be 15 characters long" }, { status: 400 });
    }

    const business = await prisma.business.create({
      data: {
        userId,
        gstin,
        state,
        address,
        registrationType,
        stateCode,
        legalName,
        tradeName,
        logoUrl,
        setupCompleted: true,
      },
    });

    return NextResponse.json({ business });
  } catch (error) {
    console.error("Error creating business:", error);
    return NextResponse.json({ error: "Failed to create business" }, { status: 500 });
  }
}
