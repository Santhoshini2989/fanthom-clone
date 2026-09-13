import { MeetingStatus } from "@prisma/client";
import { prisma, jobLog } from "../db";

/**
 * Explicit meeting state machine. Every transition goes through `transition`
 * so illegal jumps are rejected and each change is logged as a JobEvent.
 *
 *   SCHEDULED → BOT_REQUESTED → BOT_JOINING → RECORDING → PROCESSING
 *             → TRANSCRIBING → ANALYZING → COMPLETED
 *   any state → FAILED;  FAILED → (retry) BOT_REQUESTED | PROCESSING
 */
export const TRANSITIONS: Record<MeetingStatus, MeetingStatus[]> = {
  SCHEDULED: ["BOT_REQUESTED", "PROCESSING", "FAILED"],
  BOT_REQUESTED: ["BOT_JOINING", "SCHEDULED", "FAILED"],
  BOT_JOINING: ["RECORDING", "FAILED", "BOT_REQUESTED"],
  RECORDING: ["PROCESSING", "FAILED"],
  PROCESSING: ["TRANSCRIBING", "FAILED"],
  TRANSCRIBING: ["ANALYZING", "FAILED"],
  ANALYZING: ["COMPLETED", "FAILED"],
  COMPLETED: ["PROCESSING"], // re-run intelligence on demand
  FAILED: ["BOT_REQUESTED", "PROCESSING", "SCHEDULED"],
};

export const PROCESSING_STATES: MeetingStatus[] = ["PROCESSING", "TRANSCRIBING", "ANALYZING"];
export const LIVE_STATES: MeetingStatus[] = ["BOT_REQUESTED", "BOT_JOINING", "RECORDING"];

export function canTransition(from: MeetingStatus, to: MeetingStatus) {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export class InvalidTransition extends Error {
  constructor(from: MeetingStatus, to: MeetingStatus) {
    super(`Cannot move meeting from ${from} to ${to}`);
  }
}

export async function transition(
  meetingId: string,
  to: MeetingStatus,
  opts: { step?: string | null; error?: string | null; stage?: "bot" | "recording" | "transcription" | "analysis" | "db" | "pipeline" | "api"; extra?: Record<string, unknown> } = {},
) {
  const current = await prisma.meeting.findUnique({ where: { id: meetingId }, select: { status: true } });
  if (!current) throw new Error(`Meeting ${meetingId} not found`);
  if (current.status !== to && !canTransition(current.status, to)) throw new InvalidTransition(current.status, to);

  const data: Record<string, unknown> = { status: to, processingStep: opts.step ?? null };
  if (to === "FAILED") data.errorMessage = opts.error ?? "Unknown error";
  else data.errorMessage = null;
  if (to === "BOT_REQUESTED") {
    data.botClaimedAt = null;
    data.botClaimedBy = null;
    data.stopRequested = false;
  }
  if (to === "COMPLETED") data.endedAt = new Date();

  const updated = await prisma.meeting.update({ where: { id: meetingId }, data: data as never });
  await jobLog(meetingId, opts.stage ?? "db", `Meeting marked ${to}${opts.step ? ` — ${opts.step}` : ""}`, { from: current.status, ...(opts.extra ?? {}) }, to === "FAILED" ? "error" : "info");
  return updated;
}

/** Update only the human-readable sub-step (e.g. "chunk 2/3") without changing state. */
export async function setStep(meetingId: string, step: string) {
  await prisma.meeting.update({ where: { id: meetingId }, data: { processingStep: step } });
}

/**
 * Atomically claim a BOT_REQUESTED meeting for a worker. Uses a conditional
 * updateMany so two bot processes can never claim the same meeting.
 */
export async function claimNextBotJob(workerId: string) {
  const candidate = await prisma.meeting.findFirst({
    where: { status: "BOT_REQUESTED", botClaimedAt: null },
    orderBy: { updatedAt: "asc" },
    select: { id: true },
  });
  if (!candidate) return null;
  const res = await prisma.meeting.updateMany({
    where: { id: candidate.id, status: "BOT_REQUESTED", botClaimedAt: null },
    data: { botClaimedAt: new Date(), botClaimedBy: workerId },
  });
  if (res.count !== 1) return null; // someone else won the race
  return prisma.meeting.findUnique({ where: { id: candidate.id } });
}
