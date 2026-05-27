import { google, type calendar_v3 } from "googleapis";
import { prisma } from "@/lib/db";
import { getGoogleAccount } from "@/lib/calendar-connection";

export type BusyEvent = {
  start: string; // ISO 8601 (+09:00)
  end: string;
  summary: string;
  allDay: boolean;
  googleEventId: string;
  description: string | null;
  location: string | null;
  meetUrl: string | null;
};

export type MeetingEventInput = {
  title: string;
  description?: string | null;
  location?: string | null;
  start: Date;
  end: Date;
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

  client.on("tokens", (tokens) => {
    const data: Record<string, unknown> = {};
    if (tokens.access_token) data.access_token = tokens.access_token;
    if (tokens.refresh_token) data.refresh_token = tokens.refresh_token;
    if (tokens.expiry_date) data.expires_at = Math.floor(tokens.expiry_date / 1000);
    if (Object.keys(data).length === 0) return;
    prisma.account
      .update({ where: { id: account.id }, data })
      .catch(() => {
        // ベストエフォート
      });
  });

  return client;
};

const getCalendarClient = async (userId: string) => {
  const auth = await buildOAuth2Client(userId);
  if (!auth) return null;
  return google.calendar({ version: "v3", auth });
};

const extractMeetUrl = (e: calendar_v3.Schema$Event): string | null => {
  if (e.hangoutLink) return e.hangoutLink;
  const videoEntry = e.conferenceData?.entryPoints?.find(
    (p) => p.entryPointType === "video" && p.uri,
  );
  return videoEntry?.uri ?? null;
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
    description: e.description ?? null,
    location: e.location ?? null,
    meetUrl: extractMeetUrl(e),
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

const toEventBody = (input: MeetingEventInput): calendar_v3.Schema$Event => ({
  summary: input.title,
  description: input.description ?? undefined,
  location: input.location ?? undefined,
  start: { dateTime: input.start.toISOString(), timeZone: "Asia/Tokyo" },
  end: { dateTime: input.end.toISOString(), timeZone: "Asia/Tokyo" },
});

export const insertMeetingEvent = async (
  userId: string,
  input: MeetingEventInput,
): Promise<string | null> => {
  const calendar = await getCalendarClient(userId);
  if (!calendar) return null;

  const { data } = await calendar.events.insert({
    calendarId: "primary",
    requestBody: toEventBody(input),
  });
  return data.id ?? null;
};

export const patchMeetingEvent = async (
  userId: string,
  eventId: string,
  input: Partial<MeetingEventInput>,
): Promise<boolean> => {
  const calendar = await getCalendarClient(userId);
  if (!calendar) return false;

  const body: calendar_v3.Schema$Event = {};
  if (input.title !== undefined) body.summary = input.title;
  if (input.description !== undefined) body.description = input.description ?? undefined;
  if (input.location !== undefined) body.location = input.location ?? undefined;
  if (input.start)
    body.start = { dateTime: input.start.toISOString(), timeZone: "Asia/Tokyo" };
  if (input.end)
    body.end = { dateTime: input.end.toISOString(), timeZone: "Asia/Tokyo" };

  await calendar.events.patch({
    calendarId: "primary",
    eventId,
    requestBody: body,
  });
  return true;
};

export const deleteMeetingEvent = async (
  userId: string,
  eventId: string,
): Promise<boolean> => {
  const calendar = await getCalendarClient(userId);
  if (!calendar) return false;

  try {
    await calendar.events.delete({ calendarId: "primary", eventId });
    return true;
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      [404, 410].includes((err as { code: number }).code)
    ) {
      return true;
    }
    throw err;
  }
};

const PROPOSAL_COLOR_ID = "5"; // banana (yellow)
const PROPOSAL_DESCRIPTION =
  "TimePick が生成した面談候補。確定または削除すると自動的に消えます。";

export type ProposalEventInput = {
  label: string;
  start: Date;
  end: Date;
};

const toProposalEventBody = (input: ProposalEventInput): calendar_v3.Schema$Event => ({
  summary: `[候補] ${input.label}`,
  description: PROPOSAL_DESCRIPTION,
  colorId: PROPOSAL_COLOR_ID,
  transparency: "transparent",
  start: { dateTime: input.start.toISOString(), timeZone: "Asia/Tokyo" },
  end: { dateTime: input.end.toISOString(), timeZone: "Asia/Tokyo" },
});

export const insertProposalEvent = async (
  userId: string,
  input: ProposalEventInput,
): Promise<string | null> => {
  const calendar = await getCalendarClient(userId);
  if (!calendar) return null;

  const { data } = await calendar.events.insert({
    calendarId: "primary",
    requestBody: toProposalEventBody(input),
  });
  return data.id ?? null;
};

export const patchProposalEventLabel = async (
  userId: string,
  eventId: string,
  label: string,
): Promise<boolean> => {
  const calendar = await getCalendarClient(userId);
  if (!calendar) return false;

  await calendar.events.patch({
    calendarId: "primary",
    eventId,
    requestBody: { summary: `[候補] ${label}` },
  });
  return true;
};

export const deleteProposalEvent = deleteMeetingEvent; // 同じロジック
