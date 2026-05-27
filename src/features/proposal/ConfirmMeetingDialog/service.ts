export type ConfirmTarget = {
  proposalId: string;
  slotId: string;
  label: string;
  slotStart: string; // ISO
  slotEnd: string;
};

export type Duration = 30 | 60;

export const toMinutes = (hm: string): number => {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};

export const fromMinutes = (mins: number): string => {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

export const generateStartOptions = (
  slotStartHM: string,
  slotEndHM: string,
  duration: Duration,
  step = 30,
): string[] => {
  const startMin = toMinutes(slotStartHM);
  const endMin = toMinutes(slotEndHM);
  const opts: string[] = [];
  for (let t = startMin; t + duration <= endMin; t += step) {
    opts.push(fromMinutes(t));
  }
  return opts;
};

export type ConfirmInput = {
  proposalId: string;
  title: string;
  companyName: string;
  meetingUrl: string | null;
  description: string | null;
  start: string; // ISO
  end: string; // ISO
};

export type ConfirmValidationError =
  | "title_required"
  | "company_required"
  | "time_order"
  | "time_out_of_range";

export const validateConfirm = (params: {
  title: string;
  companyName: string;
  startTime: string;
  endTime: string;
  slotStartHM: string;
  slotEndHM: string;
}): ConfirmValidationError | null => {
  if (!params.title.trim() || !params.companyName.trim()) return "title_required";
  if (!params.startTime || !params.endTime || params.startTime >= params.endTime) {
    return "time_order";
  }
  if (params.startTime < params.slotStartHM || params.endTime > params.slotEndHM) {
    return "time_out_of_range";
  }
  return null;
};

export const validationErrorMessage = (e: ConfirmValidationError): string => {
  switch (e) {
    case "title_required":
    case "company_required":
      return "題名と会社名は必須です";
    case "time_order":
      return "開始は終了より前にしてください";
    case "time_out_of_range":
      return "候補レンジ内の時刻を入力してください";
  }
};

export const submitConfirm = async (input: ConfirmInput): Promise<void> => {
  const res = await fetch("/api/meetings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };
    if (body.error === "google_insert_failed") {
      throw new Error("Google Calendar への書き込みに失敗しました");
    }
    if (body.error === "already_confirmed") {
      throw new Error("この候補は既に確定済みです");
    }
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
};
