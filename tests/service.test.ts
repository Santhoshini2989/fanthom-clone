import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MEET_URL } from "@/server/meetings/service";

/**
 * Integration tests against the local Postgres. They are skipped when the
 * database is not reachable (CI without `npm run db:start`).
 */
let dbUp = false;
let svc: typeof import("@/server/meetings/service");
let prisma: typeof import("@/server/db").prisma;
const created: string[] = [];

beforeAll(async () => {
  try {
    const db = await import("@/server/db");
    await db.assertDatabase();
    prisma = db.prisma;
    svc = await import("@/server/meetings/service");
    dbUp = true;
  } catch {
    dbUp = false;
  }
});

afterAll(async () => {
  if (!dbUp) return;
  for (const id of created) await svc.deleteMeeting(id).catch(() => {});
  await prisma.$disconnect();
});

describe("Meet URL validation", () => {
  it("accepts real Meet links and rejects everything else", () => {
    expect(MEET_URL.test("https://meet.google.com/abc-defg-hij")).toBe(true);
    expect(MEET_URL.test("https://meet.google.com/abc-defg-hij?authuser=1")).toBe(true);
    expect(MEET_URL.test("http://meet.google.com/abc-defg-hij")).toBe(false);
    expect(MEET_URL.test("https://zoom.us/j/123")).toBe(false);
    expect(MEET_URL.test("https://meet.google.com/evil.example.com")).toBe(false);
    expect(MEET_URL.test("javascript:alert(1)")).toBe(false);
  });
});

describe("meeting service (database)", () => {
  it("creates a meeting for a Meet link and queues the bot", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const m = await svc.createMeeting({ title: "Vitest meeting", meetUrl: "https://meet.google.com/abc-defg-hij", startNow: true });
    created.push(m.id);
    expect(m.status).toBe("scheduled");
    expect(m.db?.status).toBe("BOT_REQUESTED");
    expect(m.db?.meetUrl).toBe("https://meet.google.com/abc-defg-hij");
    expect(m.attendeeIds.length).toBeGreaterThan(0);
  });

  it("rejects invalid Meet links", async (ctx) => {
    if (!dbUp) return ctx.skip();
    await expect(svc.createMeeting({ title: "bad", meetUrl: "https://zoom.us/j/1", startNow: true })).rejects.toThrow(/Google Meet/);
  });

  it("stop before admission returns the meeting to SCHEDULED", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const m = await svc.createMeeting({ title: "Stop me", meetUrl: "https://meet.google.com/zzz-zzzz-zzz", startNow: true });
    created.push(m.id);
    const stopped = await svc.requestStop(m.id);
    expect(stopped.db?.status).toBe("SCHEDULED");
  });

  it("adds and removes a highlight on a seeded meeting", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const list = await svc.listMeetings();
    const target = list.find((m) => m.status === "ready" && m.transcript.length > 2);
    if (!target) return ctx.skip();
    const seg = target.transcript[1];
    const res = await svc.addHighlight(target.id, { typeId: "highlight", start: seg.start, end: seg.end, title: "Vitest highlight", segmentIds: [seg.id], kind: "highlight" });
    const h = res.meeting.highlights.find((x) => x.id === res.highlightId);
    expect(h).toBeTruthy();
    expect(h?.start).toBe(seg.start);
    const after = await svc.removeHighlight(target.id, res.highlightId);
    expect(after.highlights.some((x) => x.id === res.highlightId)).toBe(false);
  });

  it("search finds transcript text and titles", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const list = await svc.listMeetings();
    const target = list.find((m) => m.status === "ready" && m.transcript.length > 0);
    if (!target) return ctx.skip();
    const word = target.transcript[0].text.split(/\s+/).find((w) => w.length > 5)?.replace(/[^\w]/g, "");
    if (!word) return ctx.skip();
    const hits = await svc.search(word);
    expect(hits.some((h) => h.meetingId === target.id)).toBe(true);
    expect(await svc.search("x")).toEqual([]);
  });
});
