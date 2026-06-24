import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest){
    try{
        const { name, email, password, phone } = await req.json();
        if (!name || !email || !password) {
            return NextResponse.json({ error: "name, email and password are required" }, { status: 400 });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        if(!hashedPassword){
            return NextResponse.json({ error: "Failed to hash password" }, { status: 400 });
        }
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone: phone || "",
                joining_date: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        })
        return NextResponse.json({ user });
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

}
