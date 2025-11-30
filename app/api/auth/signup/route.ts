import { hashPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try{
        const body = await req.json();
        const { email, name, password } = body;

        if(!email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }
        const hashedPassword = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                email,
                name,
                hashedPassword,
            },
        });

        return NextResponse.json({ message: 'User created successfully', userId: user.id }, { status: 201 });
    } catch (error) {
        console.error('Error during user signup:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}