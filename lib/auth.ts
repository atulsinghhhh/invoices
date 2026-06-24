import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type NextAuthUser = { id?: string; name?: string; email?: string };
type NextAuthProfile = { email?: string; name?: string; picture?: string };

export const authOptions: NextAuthOptions = {
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
                const user = await prisma.user.findUnique({ where: { email: credentials.email } });
                if (!user || !user.password) return null;

                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) return null;

                return { id: String(user.id), name: user.name, email: user.email };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                const u = user as NextAuthUser;
                (token as Record<string, unknown>)["id"] = u.id ?? (token as Record<string, unknown>)["id"];
            }
            return token;
        },
        async session({ session, token }) {
            const id = token["id"] as string | undefined;
            return { ...session, user: { ...session.user, id } };
        },
        async signIn({ user, account, profile }) {
            try {
                if (account?.provider === "google") {
                    const p = profile as NextAuthProfile;
                    const email = p?.email;
                    if (!email) return false;
                    const u = user as NextAuthUser;

                    await prisma.user.upsert({
                        where: { email },
                        update: {
                            name: p?.name || u?.name,
                            avatar_url: p?.picture || undefined,
                        },
                        create: {
                            name: p?.name || u?.name || "",
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
    secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth } = NextAuth(authOptions);
