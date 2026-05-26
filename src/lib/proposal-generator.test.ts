import { describe, it, expect } from "vitest";
import { generateProposalCandidates } from "./proposal-generator";
import type { WeeklyHours } from "./availability";

const HOURS_10_18: WeeklyHours = {
  sun: null,
  mon: { start: "10:00", end: "18:00" },
  tue: { start: "10:00", end: "18:00" },
  wed: { start: "10:00", end: "18:00" },
  thu: { start: "10:00", end: "18:00" },
  fri: { start: "10:00", end: "18:00" },
  sat: null,
};

const jst = (s: string) => new Date(`${s}+09:00`);

describe("generateProposalCandidates", () => {
  it("競合がなければ各営業日にウィンドウを丸ごと返す", () => {
    const result = generateProposalCandidates({
      weeklyHours: HOURS_10_18,
      skipHolidays: true,
      exceptions: [],
      conflicts: [],
      from: jst("2026-06-01T00:00:00"),
      to: jst("2026-06-05T23:59:59"),
      now: jst("2026-05-31T00:00:00"),
    });

    expect(result).toHaveLength(5);
    for (const r of result) {
      expect(r.end.getTime() - r.start.getTime()).toBe(8 * 60 * 60 * 1000);
    }
  });

  it("土日と祝日は skipHolidays=true で除外される", () => {
    const result = generateProposalCandidates({
      weeklyHours: HOURS_10_18,
      skipHolidays: true,
      exceptions: [],
      conflicts: [],
      from: jst("2026-05-02T00:00:00"),
      to: jst("2026-05-08T23:59:59"),
      now: jst("2026-05-01T00:00:00"),
    });

    // 営業日のみ (土日 5/2, 5/3 + 祝日 5/4, 5/5, 5/6 を除外して 5/7, 5/8)
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it("busy 時間を引いた連続レンジを返す", () => {
    const result = generateProposalCandidates({
      weeklyHours: HOURS_10_18,
      skipHolidays: true,
      exceptions: [],
      conflicts: [
        { start: jst("2026-06-01T12:00:00"), end: jst("2026-06-01T13:00:00") },
      ],
      from: jst("2026-06-01T00:00:00"),
      to: jst("2026-06-01T23:59:59"),
      now: jst("2026-05-31T00:00:00"),
    });

    expect(result).toHaveLength(2);
    expect(result[0].start.getTime()).toBe(jst("2026-06-01T10:00:00").getTime());
    expect(result[0].end.getTime()).toBe(jst("2026-06-01T12:00:00").getTime());
    expect(result[1].start.getTime()).toBe(jst("2026-06-01T13:00:00").getTime());
    expect(result[1].end.getTime()).toBe(jst("2026-06-01T18:00:00").getTime());
  });

  it("bufferAfterMinutes で busy 終了から N 分後ろを除外する", () => {
    // 10:00-15:00 のうち 13:00-14:00 が busy、bufferAfter=30 → 10-13 と 14:30-15
    const result = generateProposalCandidates({
      weeklyHours: {
        ...HOURS_10_18,
        mon: { start: "10:00", end: "15:00" },
      },
      skipHolidays: true,
      exceptions: [],
      conflicts: [
        { start: jst("2026-06-01T13:00:00"), end: jst("2026-06-01T14:00:00") },
      ],
      from: jst("2026-06-01T00:00:00"),
      to: jst("2026-06-01T23:59:59"),
      minRangeMinutes: 30,
      bufferAfterMinutes: 30,
      now: jst("2026-05-31T00:00:00"),
    });

    expect(result).toHaveLength(2);
    expect(result[0].start.getTime()).toBe(jst("2026-06-01T10:00:00").getTime());
    expect(result[0].end.getTime()).toBe(jst("2026-06-01T13:00:00").getTime());
    expect(result[1].start.getTime()).toBe(jst("2026-06-01T14:30:00").getTime());
    expect(result[1].end.getTime()).toBe(jst("2026-06-01T15:00:00").getTime());
  });

  it("bufferAfter 適用後に minRange を満たさないレンジは除外される", () => {
    // 上と同じだが minRange=60 にすると 14:30-15:00 (30分) は外れる
    const result = generateProposalCandidates({
      weeklyHours: {
        ...HOURS_10_18,
        mon: { start: "10:00", end: "15:00" },
      },
      skipHolidays: true,
      exceptions: [],
      conflicts: [
        { start: jst("2026-06-01T13:00:00"), end: jst("2026-06-01T14:00:00") },
      ],
      from: jst("2026-06-01T00:00:00"),
      to: jst("2026-06-01T23:59:59"),
      minRangeMinutes: 60,
      bufferAfterMinutes: 30,
      now: jst("2026-05-31T00:00:00"),
    });

    expect(result).toHaveLength(1);
    expect(result[0].start.getTime()).toBe(jst("2026-06-01T10:00:00").getTime());
    expect(result[0].end.getTime()).toBe(jst("2026-06-01T13:00:00").getTime());
  });

  it("minRangeMinutes 未満のレンジは除外される (バッファなし)", () => {
    const result = generateProposalCandidates({
      weeklyHours: HOURS_10_18,
      skipHolidays: true,
      exceptions: [],
      conflicts: [
        { start: jst("2026-06-01T11:00:00"), end: jst("2026-06-01T17:00:00") },
      ],
      from: jst("2026-06-01T00:00:00"),
      to: jst("2026-06-01T23:59:59"),
      minRangeMinutes: 90,
      now: jst("2026-05-31T00:00:00"),
    });

    expect(result).toHaveLength(0);
  });

  it("例外 (終日休み) はその日を除外", () => {
    const result = generateProposalCandidates({
      weeklyHours: HOURS_10_18,
      skipHolidays: true,
      exceptions: [{ id: "x1", date: "2026-06-02", start: null, end: null, note: null }],
      conflicts: [],
      from: jst("2026-06-01T00:00:00"),
      to: jst("2026-06-03T23:59:59"),
      now: jst("2026-05-31T00:00:00"),
    });

    expect(result).toHaveLength(2);
  });

  it("例外 (時間上書き) で稼働時間を変更", () => {
    const result = generateProposalCandidates({
      weeklyHours: HOURS_10_18,
      skipHolidays: true,
      exceptions: [
        { id: "x1", date: "2026-06-01", start: "14:00", end: "16:00", note: null },
      ],
      conflicts: [],
      from: jst("2026-06-01T00:00:00"),
      to: jst("2026-06-01T23:59:59"),
      now: jst("2026-05-31T00:00:00"),
    });

    expect(result).toHaveLength(1);
    expect(result[0].start.getTime()).toBe(jst("2026-06-01T14:00:00").getTime());
    expect(result[0].end.getTime()).toBe(jst("2026-06-01T16:00:00").getTime());
  });

  it("過去の時刻は除外", () => {
    const result = generateProposalCandidates({
      weeklyHours: HOURS_10_18,
      skipHolidays: true,
      exceptions: [],
      conflicts: [],
      from: jst("2026-06-01T00:00:00"),
      to: jst("2026-06-01T23:59:59"),
      now: jst("2026-06-01T14:00:00"),
    });

    expect(result).toHaveLength(1);
    expect(result[0].start.getTime()).toBe(jst("2026-06-01T14:00:00").getTime());
    expect(result[0].end.getTime()).toBe(jst("2026-06-01T18:00:00").getTime());
  });

  it("結果は時刻順にソート", () => {
    const result = generateProposalCandidates({
      weeklyHours: HOURS_10_18,
      skipHolidays: true,
      exceptions: [],
      conflicts: [],
      from: jst("2026-06-01T00:00:00"),
      to: jst("2026-06-05T23:59:59"),
      now: jst("2026-05-31T00:00:00"),
    });

    for (let i = 1; i < result.length; i++) {
      expect(result[i].start.getTime()).toBeGreaterThanOrEqual(
        result[i - 1].start.getTime(),
      );
    }
  });
});
