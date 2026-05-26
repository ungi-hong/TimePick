import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { isEmailAllowed } from "@/lib/allowlist";

// Edge-safe configuration (no DB / Prisma references).
// Used by middleware on the Edge runtime, and extended by `auth.ts` for full routes.
export default {
  providers: [
    Google({
      authorization: { params: { scope: "openid email profile" } },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return false;
      return isEmailAllowed(user.email);
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
} satisfies NextAuthConfig;
