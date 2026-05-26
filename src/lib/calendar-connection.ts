import { prisma } from "@/lib/db";

export const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
] as const;

export const CALENDAR_AUTHORIZATION_PARAMS = {
  scope: ["openid", "email", "profile", ...CALENDAR_SCOPES].join(" "),
  prompt: "consent",
  access_type: "offline",
  include_granted_scopes: "true",
} as const;

export const getGoogleAccount = (userId: string) =>
  prisma.account.findFirst({ where: { userId, provider: "google" } });

export const hasCalendarConnection = async (userId: string): Promise<boolean> => {
  const account = await getGoogleAccount(userId);
  if (!account?.scope) return false;
  const granted = new Set(account.scope.split(" "));
  return CALENDAR_SCOPES.every((s) => granted.has(s));
};

export const clearCalendarConnection = async (userId: string): Promise<void> => {
  await prisma.account.updateMany({
    where: { userId, provider: "google" },
    data: {
      access_token: null,
      refresh_token: null,
      expires_at: null,
      scope: null,
      id_token: null,
    },
  });
};
