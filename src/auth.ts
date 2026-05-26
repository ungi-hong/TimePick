import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import authConfig from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
  events: {
    // 再認証 (例: 設定画面から Calendar スコープを追加) 時に Account の token を最新化する。
    // PrismaAdapter は初回ログインで Account を作るが、その後のサインインでは自動更新しないため。
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.id) return;

      await prisma.account.update({
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId: account.providerAccountId,
          },
        },
        data: {
          access_token: account.access_token,
          refresh_token: account.refresh_token ?? undefined, // 再認証時に refresh_token が返ってこない場合は既存値を維持
          expires_at: account.expires_at,
          scope: account.scope,
          token_type: account.token_type,
          id_token: account.id_token,
        },
      }).catch(() => {
        // 初回ログイン直後の linkAccount より前に発火するケースは無視
      });
    },
  },
});
