import {
  AvailabilityExceptionInputSchema,
  type AvailabilityExceptionDto,
  type AvailabilityExceptionInput,
} from "@/lib/availability";

export type FormState = {
  date: string;
  closed: boolean;
  start: string;
  end: string;
  note: string;
};

export const DEFAULT_FORM: FormState = {
  date: "",
  closed: true,
  start: "10:00",
  end: "18:00",
  note: "",
};

export const toPayload = (form: FormState): AvailabilityExceptionInput => ({
  date: form.date,
  start: form.closed ? null : form.start,
  end: form.closed ? null : form.end,
  note: form.note.trim() || null,
});

export const validatePayload = (
  payload: AvailabilityExceptionInput,
): boolean => AvailabilityExceptionInputSchema.safeParse(payload).success;

export const createException = async (
  payload: AvailabilityExceptionInput,
): Promise<AvailabilityExceptionDto> => {
  const res = await fetch("/api/availability/exceptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as AvailabilityExceptionDto;
};

export const deleteException = async (id: string): Promise<void> => {
  const res = await fetch(`/api/availability/exceptions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
};

export const sortByDate = (
  items: AvailabilityExceptionDto[],
): AvailabilityExceptionDto[] =>
  [...items].sort((a, b) => a.date.localeCompare(b.date));
