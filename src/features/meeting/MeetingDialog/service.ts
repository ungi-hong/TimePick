import type { Meeting } from "@/lib/use-meetings";

export type MeetingFormDraft = {
  title: string;
  companyName: string;
  meetingUrl: string;
  description: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
};

export type MeetingFormError =
  | "title_required"
  | "company_required"
  | "time_invalid";

export const validateMeetingForm = (
  draft: MeetingFormDraft,
): MeetingFormError | null => {
  if (!draft.title.trim() || !draft.companyName.trim()) {
    return "title_required";
  }
  if (
    !draft.date ||
    !draft.startTime ||
    !draft.endTime ||
    draft.startTime >= draft.endTime
  ) {
    return "time_invalid";
  }
  return null;
};

export const meetingFormErrorMessage = (e: MeetingFormError): string => {
  switch (e) {
    case "title_required":
    case "company_required":
      return "題名と会社名は必須です";
    case "time_invalid":
      return "時刻を確認してください";
  }
};

export type MeetingPatchInput = {
  title: string;
  companyName: string;
  meetingUrl: string | null;
  description: string | null;
  start: string; // ISO
  end: string; // ISO
};

export const buildPatchInput = (draft: MeetingFormDraft): MeetingPatchInput => ({
  title: draft.title.trim(),
  companyName: draft.companyName.trim(),
  meetingUrl: draft.meetingUrl.trim() ? draft.meetingUrl.trim() : null,
  description: draft.description.trim() ? draft.description.trim() : null,
  start: new Date(`${draft.date}T${draft.startTime}:00+09:00`).toISOString(),
  end: new Date(`${draft.date}T${draft.endTime}:00+09:00`).toISOString(),
});

export const patchMeeting = async (
  id: string,
  input: MeetingPatchInput,
): Promise<void> => {
  const res = await fetch(`/api/meetings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
};

export const deleteMeeting = async (id: string): Promise<void> => {
  const res = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
};

export type { Meeting };
