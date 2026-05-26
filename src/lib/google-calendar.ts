import { google, type calendar_v3 } from "googleapis";
import { prisma } from "@/lib/db";
import { getGoogleAccount } from "@/lib/calendar-connection";

export type BusyEvent = {
  start: string; // ISO 8601 (+09:00)
  end: string;
  summary: string;
  allDay: boolean;
  googleEventId: string;
};

const buildOAuth2Client = async (userId: string) => {
  const account = await getGoogleAccount(userId);
  if (!account?.access_token) return null;

  const client = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET,
  );
  client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  // 期限切れ時の自動リフレッシュを DB に反映
  client.on("tokens", (tokens) => {
    const data: Record<string, unknown> = {};
    if (tokens.access_token) data.access_token = tokens.access_token;
    if (tokens.refresh_token) data.refresh_token = tokens.refresh_token;
    if (tokens.expiry_date) data.expires_at = Math.floor(tokens.expiry_date / 1000);
    if (Object.keys(data).length === 0) return;
    prisma.account
      .update({ where: { id: account.id }, data })
      .catch(() => {
        // ベストエフォート: 反映失敗してもクライアント側のメモリにはあるので継続
      });
  });

  return client;
};

const getCalendarClient = async (userId: string) => {
  const auth = await buildOAuth2Client(userId);
  if (!auth) return null;
  return google.calendar({ version: "v3", auth });
};

const toBusyEvent = (e: calendar_v3.Schema$Event): BusyEvent | null => {
  const allDay = !!e.start?.date && !e.start?.dateTime;
  const startStr = e.start?.dateTime ?? e.start?.date;
  const endStr = e.end?.dateTime ?? e.end?.date;
  if (!startStr || !endStr) return null;

  return {
    start: allDay ? `${startStr}T00:00:00+09:00` : startStr,
    end: allDay ? `${endStr}T00:00:00+09:00` : endStr,
    summary: e.summary ?? "(無題)",
    allDay,
    googleEventId: e.id ?? "",
  };
};

export const listBusyEvents = async (
  userId: string,
  from: Date,
  to: Date,
): Promise<BusyEvent[]> => {
  const calendar = await getCalendarClient(userId);
  if (!calendar) return [];

  const { data } = await calendar.events.list({
    calendarId: "primary",
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 2500,
    timeZone: "Asia/Tokyo",
  });

  return (data.items ?? [])
    .filter((e) => e.status !== "cancelled" && (e.start?.dateTime || e.start?.date))
    .map(toBusyEvent)
    .filter((e): e is BusyEvent => e !== null);
};
