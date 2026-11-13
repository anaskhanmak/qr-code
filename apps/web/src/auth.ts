import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@loopmark/db";
import { getAuthorizedUser } from "@/lib/auth-credentials";

export { getAuthorizedUser } from "@/lib/auth-credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        if (!rawCredentials || typeof rawCredentials !== "object") return null;
        const email = typeof rawCredentials.email === "string" ? rawCredentials.email : "";
        const password = typeof rawCredentials.password === "string" ? rawCredentials.password : "";
        return getAuthorizedUser(email, password);
      },

      // async authorize(rawCredentials) {
      //   console.log("1. Authorize called");

      //   const parsed = credentialsSchema.safeParse(rawCredentials);

      //   if (!parsed.success) {
      //     console.log("2. Validation failed:", parsed.error.flatten());
      //     return null;
      //   }

      //   console.log("2. Credentials validated");

      //   const user = await db.user.findUnique({
      //     where: { email: parsed.data.email },
      //   });

      //   if (!user) {
      //     console.log("3. User not found");
      //     return null;
      //   }

      //   console.log("3. User found");
      //   console.log("4. Has password:", !!user.passwordHash);
      //   console.log("5. Email verified:", !!user.emailVerified);

      //   if (!user.passwordHash) return null;
      //   if (!user.emailVerified) return null;

      //   const isValid = await compare(parsed.data.password, user.passwordHash);

      //   console.log("6. Password valid:", isValid);

      //   if (!isValid) return null;

      //   console.log("7. Login successful");

      //   return {
      //     id: user.id,
      //     name: user.name,
      //     email: user.email,
      //   };
      // },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      await db.workspace.create({
        data: {
          name: `${user.name ?? "My"} workspace`,
          members: { create: { userId: user.id, role: "OWNER" } },
        },
      });
    },
  },
});
