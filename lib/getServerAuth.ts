// lib/getServerAuth.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getServerAuthSession(req?: Request) {
  return await getServerSession(authOptions);
}
