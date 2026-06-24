import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
    try{
        const businesses = await prisma.business.findMany();
        return NextResponse.json({ businesses });
    } catch (error) {
        console.error("Error fetching businesses:", error);
        return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try{
        const session = await auth();
        const userId = Number(session?.user?.id);
        if (!userId || Number.isNaN(userId)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { trade_name, address, state, StateCode, city, pinCode } = await req.json();
        const business = await prisma.business.update({
            where: { id: userId }, // Hardcoded for now, should come from session or auth
            data: {
                trade_name,
                address,
                state,
                StateCode,
                city,
                pinCode,
                updatedAt: new Date(),
            }
        });
        return NextResponse.json({ business }); 
    } catch (error) {
        console.error("Error updating business:", error);
        return NextResponse.json({ error: "Failed to update business" }, { status: 500 });
    }
}