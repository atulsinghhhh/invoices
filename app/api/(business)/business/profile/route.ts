import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const business = await prisma.business.findUnique({
      where: { userId },
      include: { settings: true },
    });
    return NextResponse.json({ business });
  } catch (error) {
    console.error("Error fetching business profile:", error);
    return NextResponse.json({ error: "Failed to fetch business profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { legalName, tradeName, address, state, stateCode, city, pinCode, logoUrl } = await req.json();
    const business = await prisma.business.update({
      where: { userId },
      data: {
        legalName,
        tradeName,
        address,
        state,
        stateCode,
        city,
        pinCode,
        logoUrl,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ business });
  } catch (error) {
    console.error("Error updating business profile:", error);
    return NextResponse.json({ error: "Failed to update business profile" }, { status: 500 });
  }
}
