import { NextResponse } from "next/server";
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

// リフレッシュトークンが失効 (invalid_grant) したときに google-calendar 層が投げる。
// route 側で 412 (再連携要求) に変換する。
export class CalendarAuthError extends Error {
  constructor(options?: { cause?: unknown }) {
    super("calendar_auth_invalid", options);
    this.name = "CalendarAuthError";
  }
}

// gaxios / googleapis のトークン更新失敗 (invalid_grant) を判定する。
export const isInvalidGrantError = (err: unknown): boolean => {
  if (typeof err !== "object" || err === null) return false;
  const e = err as {
    response?: { data?: { error?: unknown } };
    message?: unknown;
  };
  return e.response?.data?.error === "invalid_grant" || e.message === "invalid_grant";
};

// route の catch で使う。CalendarAuthError なら接続情報をクリアして 412 を返す。
// 該当しなければ null を返すので、呼び出し側で通常のエラー処理を続ける。
export const reauthResponseIfNeeded = async (
  userId: string,
  err: unknown,
): Promise<NextResponse | null> => {
  if (!(err instanceof CalendarAuthError)) return null;
  await clearCalendarConnection(userId);
  return NextResponse.json(
    { error: "calendar_not_connected", reason: "reauth_required" },
    { status: 412 },
  );
};

// gaxios エラーは config/response にリフレッシュトークンを含むため丸ごとログに出すと漏えいする。
// message と stack のみに絞る。
export const safeErrorLog = (err: unknown): string => {
  if (err instanceof Error) return err.stack ?? err.message;
  return String(err);
};
