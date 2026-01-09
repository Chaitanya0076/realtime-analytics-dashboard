import NextAuth from "next-auth/next";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentailsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/auth";


export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentailsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if(!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.hashedPassword) {
                    return null;
                }
                const isValid = await verifyPassword(
                    credentials.password,
                    user.hashedPassword
                );

                if (!isValid) {
                    return null;
                }

                // return a user object - NextAuth will store in session
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                };
            }
        }),

        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account }) {
            // For OAuth providers, check if a user with this email already exists
            // If they do, link the OAuth account to the existing user instead of creating a new one
            if (account && account.provider !== "credentials" && user?.email) {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                    include: { accounts: true },
                });

                if (existingUser) {
                    // User exists - check if this OAuth account is already linked
                    const accountExists = existingUser.accounts.some(
                        (acc) => acc.provider === account.provider && acc.providerAccountId === account.providerAccountId
                    );

                    if (!accountExists) {
                        // Link the OAuth account to the existing user
                        // Use upsert to handle potential race conditions
                        try {
                            await prisma.account.upsert({
                                where: {
                                    provider_providerAccountId: {
                                        provider: account.provider,
                                        providerAccountId: account.providerAccountId,
                                    },
                                },
                                update: {
                                    userId: existingUser.id,
                                    refresh_token: account.refresh_token,
                                    access_token: account.access_token,
                                    expires_at: account.expires_at,
                                    token_type: account.token_type,
                                    scope: account.scope,
                                    id_token: account.id_token,
                                    session_state: account.session_state,
                                },
                                create: {
                                    userId: existingUser.id,
                                    type: account.type,
                                    provider: account.provider,
                                    providerAccountId: account.providerAccountId,
                                    refresh_token: account.refresh_token,
                                    access_token: account.access_token,
                                    expires_at: account.expires_at,
                                    token_type: account.token_type,
                                    scope: account.scope,
                                    id_token: account.id_token,
                                    session_state: account.session_state,
                                },
                            });
                        } catch {
                            // Account might have been created by PrismaAdapter in the meantime
                            // This is fine, we'll just continue - PrismaAdapter will handle the linking
                        }
                    }

                    // Update the user object to use the existing user's ID
                    // This ensures PrismaAdapter uses the existing user instead of creating a new one
                    user.id = existingUser.id;
                    user.email = existingUser.email;
                    // Update name and image if they're not set in existing user
                    if (!existingUser.name && user.name) {
                        await prisma.user.update({
                            where: { id: existingUser.id },
                            data: { name: user.name },
                        });
                    }
                    if (!existingUser.image && user.image) {
                        await prisma.user.update({
                            where: { id: existingUser.id },
                            data: { image: user.image },
                        });
                    }
                }
                // If user doesn't exist, PrismaAdapter will create a new user
            }

            // Allow all sign-ins - PrismaAdapter handles user creation/linking
            return true;
        },
        async jwt({ token, user, account }) {
            // For OAuth providers, always fetch the user from database based on the account
            // This ensures we get the correct user linked to the specific OAuth account
            // and prevents issues when switching between different OAuth accounts
            if (account && account.provider !== "credentials") {
                const accountRecord = await prisma.account.findUnique({
                    where: {
                        provider_providerAccountId: {
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                        },
                    },
                    include: {
                        user: true,
                    },
                });
                
                if (accountRecord?.user) {
                    // Use the user from database - this is the correct user for this OAuth account
                    token.id = accountRecord.user.id;
                    token.email = accountRecord.user.email;
                    token.name = accountRecord.user.name;
                    token.image = accountRecord.user.image;
                    return token;
                }
            }
            
            // For credentials provider or if OAuth lookup failed, use the user object
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.image = user.image;
            }
            
            return token;
        },
        async session({ session, token }) {
            if (session?.user && token) {
                session.user.id = token.id as string;
                if (token.email) {
                    session.user.email = token.email as string;
                }
                if (token.name) {
                    session.user.name = token.name as string;
                }
                if (token.image) {
                    session.user.image = token.image as string;
                }
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            // Handle redirects after sign in
            // If url is relative, make it absolute
            if (url.startsWith("/")) {
                return `${baseUrl}${url}`;
            }
            // If url is on the same origin, allow it
            if (new URL(url).origin === baseUrl) {
                return url;
            }
            // Default redirect to dashboard
            return `${baseUrl}/dashboard`;
        }
    },
    pages: {
        signIn: '/auth/signin',
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };