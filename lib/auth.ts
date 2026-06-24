import NextAuth, { type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const config = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) return null;
                const email = String(credentials.email);
                const password = String(credentials.password);

                const user = await prisma.user.findUnique({ where: { email } });
                if (!user || !user.password) return null;

                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) return null;

                return { id: String(user.id), name: user.name, email: user.email };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token?.id) {
                session.user.id = token.id as string;
            }
            return session;
        },
        async signIn({ user, account, profile }) {
            try {
                if (account?.provider === "google") {
                    const email = profile?.email;
                    if (!email) return false;

                    await prisma.user.upsert({
                        where: { email },
                        update: {
                            name: profile?.name ?? user?.name ?? "",
                            avatar_url: profile?.picture ?? undefined,
                        },
                        create: {
                            name: profile?.name ?? user?.name ?? "",
                            email,
                            password: "",
                            phone: "",
                            joining_date: new Date(),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                    });
                }
                return true;
            } catch (err) {
                console.error("Error in signIn upsert:", err);
                return false;
            }
        },
    },
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
