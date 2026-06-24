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
    const { logoUrl } = await req.json();
    const business = await prisma.business.update({
      where: { userId },
      data: {
        logoUrl,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ business });
  } catch (error) {
    console.error("Error updating business logo:", error);
    return NextResponse.json({ error: "Failed to update business logo" }, { status: 500 });
  }
}
