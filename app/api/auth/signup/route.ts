import { hashPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/validations";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Validate request body with Zod
        const validationResult = signupSchema.safeParse(body);
        
        if (!validationResult.success) {
            const errors = validationResult.error.issues.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            
            return NextResponse.json(
                { 
                    error: "Validation failed",
                    details: errors 
                },
                { status: 400 }
            );
        }

        const { email, name, password } = validationResult.data;

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