import fs from "node:fs";
import path from "node:path";
import { Prisma, type MeetingStatus } from "@prisma/client";
import { z } from "zod";
import { prisma, jobLog } from "../db";
import { storageDir } from "../env";
import { log } from "../logger";
import { cut } from "../audio/ffmpeg";
import { meetingInclude, toUiMeeting, toUiHighlightType } from "./mapper";
import { transition } from "./state";

/**
 * Application service used by the API routes. All writes go through here so
 * validation and state rules live in one place.
 */

export class NotFound extends Error {}
export class BadRequest extends Error {}

export async function defaultWorkspace() {
  const ws = await prisma.workspace.findFirst({ orderBy: { createdAt: "asc" } });
  if (!ws) throw new Error("No workspace. Run `npm run db:seed`.");
  return ws;
}

export async function currentUser() {
  const u = await prisma.user.findFirst({ where: { email: "nancy@brightline.io" } }) ?? (await prisma.user.findFirst({ orderBy: { createdAt: "asc" } }));
  if (!u) throw new Error("No users. Run `npm run db:seed`.");
  return u;
}

// ------------------------------------------------------------------ meetings

export async function listMeetings() {
  const rows = await prisma.meeting.findMany({ include: meetingInclude, orderBy: { startedAt: "desc" } });
  return rows.map(toUiMeeting);
}

export async function getMeeting(id: string) {
  const row = await prisma.meeting.findUnique({ where: { id }, include: meetingInclude });
  if (!row) throw new NotFound(`Meeting ${id} not found`);
  return toUiMeeting(row);
}

export const MEET_URL = /^https:\/\/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})(?:[/?#].*)?$/i;

export const CreateMeetingSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  meetUrl: z.string().trim().url().optional().or(z.literal("")),
  startNow: z.boolean().optional().default(true),
  startedAt: z.string().datetime().optional(),
  meetingType: z.string().optional(),
});

export async function createMeeting(input: z.infer<typeof CreateMeetingSchema>) {
  const ws = await defaultWorkspace();
  const me = await currentUser();
  let meetUrl: string | null = null;
  if (input.meetUrl) {
    const m = input.meetUrl.match(MEET_URL);
    if (!m) throw new BadRequest("Enter a Google Meet link like https://meet.google.com/abc-defg-hij");
    meetUrl = `https://meet.google.com/${m[1].toLowerCase()}`;
  }
  const status: MeetingStatus = meetUrl && input.startNow ? "BOT_REQUESTED" : "SCHEDULED";
  const row = await prisma.meeting.create({
    data: {
      workspaceId: ws.id,
      ownerId: me.id,
      title: input.title?.trim() || (meetUrl ? `Google Meet ${meetUrl.split("/").pop()}` : "Untitled meeting"),
      meetUrl,
      platform: "GOOGLE_MEET",
      status,
      startedAt: input.startedAt ? new Date(input.startedAt) : new Date(),
      meetingType: input.meetingType ?? "Internal",
      thumbnailSeed: Math.floor(Math.random() * 50) + 1,
      visibility: "NO_TEAMS",
      shareAccess: "ADDED",
      participants: { create: [{ userId: me.id, name: me.name, email: me.email, isHost: true }] },
      shares: { create: [{ kind: "USER", target: me.id, label: me.name, sublabel: me.email, role: "OWNER" }] },
    },
    include: meetingInclude,
  });
  await jobLog(row.id, "api", status === "BOT_REQUESTED" ? "Bot requested" : "Meeting created", { meetUrl });
  return toUiMeeting(row);
}

export async function updateMeeting(id: string, patch: { title?: string; visibility?: string; shareAccess?: string; folderId?: string | null; meetUrl?: string }) {
  const data: Prisma.MeetingUpdateInput = {};
  if (patch.title !== undefined) data.title = z.string().trim().min(1).max(200).parse(patch.title);
  if (patch.visibility) data.visibility = patch.visibility.toUpperCase() as never;
  if (patch.shareAccess) data.shareAccess = patch.shareAccess.toUpperCase() as never;
  if (patch.folderId !== undefined) data.folder = patch.folderId ? { connect: { id: patch.folderId } } : { disconnect: true };
  if (patch.meetUrl !== undefined) {
    const m = patch.meetUrl.match(MEET_URL);
    if (!m) throw new BadRequest("Invalid Google Meet link");
    data.meetUrl = `https://meet.google.com/${m[1].toLowerCase()}`;
  }
  const row = await prisma.meeting.update({ where: { id }, data, include: meetingInclude }).catch(() => null);
  if (!row) throw new NotFound(`Meeting ${id} not found`);
  return toUiMeeting(row);
}

export async function deleteMeeting(id: string) {
  const row = await prisma.meeting.findUnique({ where: { id }, include: { recording: true, clips: true } });
  if (!row) throw new NotFound(`Meeting ${id} not found`);
  await prisma.meeting.delete({ where: { id } });
  for (const f of [row.recording?.filePath, ...row.clips.map((c) => c.filePath)]) {
    if (!f) continue;
    const abs = path.isAbsolute(f) ? f : storageDir(f);
    fs.rm(abs, { force: true }, () => {});
  }
}

export async function requestBot(id: string) {
  const row = await prisma.meeting.findUnique({ where: { id } });
  if (!row) throw new NotFound(`Meeting ${id} not found`);
  if (!row.meetUrl) throw new BadRequest("Add a Google Meet link before starting the bot");
  if (!["SCHEDULED", "FAILED", "BOT_REQUESTED"].includes(row.status)) throw new BadRequest(`Cannot start the bot while the meeting is ${row.status}`);
  await transition(id, "BOT_REQUESTED", { stage: "api" });
  return getMeeting(id);
}

export async function requestStop(id: string) {
  const row = await prisma.meeting.findUnique({ where: { id } });
  if (!row) throw new NotFound(`Meeting ${id} not found`);
  if (row.status === "BOT_REQUESTED") {
    await transition(id, "SCHEDULED", { stage: "api" });
    return getMeeting(id);
  }
  if (!["BOT_JOINING", "RECORDING"].includes(row.status)) throw new BadRequest(`Nothing to stop: meeting is ${row.status}`);
  await prisma.meeting.update({ where: { id }, data: { stopRequested: true } });
  await jobLog(id, "api", "Stop requested");
  return getMeeting(id);
}

export async function retryMeeting(id: string) {
  const row = await prisma.meeting.findUnique({ where: { id }, include: { recording: true } });
  if (!row) throw new NotFound(`Meeting ${id} not found`);
  if (row.status !== "FAILED" && row.status !== "COMPLETED") throw new BadRequest(`Cannot retry while ${row.status}`);
  if (row.recording) {
    await transition(id, "PROCESSING", { step: "Retrying", stage: "api" });
    return { meeting: await getMeeting(id), mode: "process" as const };
  }
  if (row.meetUrl) {
    await transition(id, "BOT_REQUESTED", { stage: "api" });
    return { meeting: await getMeeting(id), mode: "bot" as const };
  }
  throw new BadRequest("Nothing to retry: no recording and no Meet link");
}

export async function meetingStatus(id: string) {
  const row = await prisma.meeting.findUnique({
    where: { id },
    select: { status: true, processingStep: true, errorMessage: true, stopRequested: true, botClaimedAt: true, updatedAt: true, duration: true, recording: { select: { duration: true, provider: true } } },
  });
  if (!row) throw new NotFound(`Meeting ${id} not found`);
  const events = await prisma.jobEvent.findMany({ where: { meetingId: id }, orderBy: { createdAt: "desc" }, take: 20 });
  return { ...row, events: events.reverse() };
}

// ------------------------------------------------------------------ recordings

export async function attachRecording(meetingId: string, file: { absPath: string; mimeType: string; duration: number; provider: "REAL" | "MOCK" | "IMPORT" }) {
  const rel = path.relative(storageDir(), file.absPath).replace(/\\/g, "/");
  const size = fs.statSync(file.absPath).size;
  await prisma.recording.upsert({
    where: { meetingId },
    create: { meetingId, filePath: rel, mimeType: file.mimeType, duration: file.duration, size, provider: file.provider },
    update: { filePath: rel, mimeType: file.mimeType, duration: file.duration, size, provider: file.provider },
  });
  await prisma.meeting.update({ where: { id: meetingId }, data: { duration: Math.round(file.duration) } });
  await jobLog(meetingId, "recording", "Recording saved", { file: rel, bytes: size, seconds: Math.round(file.duration), provider: file.provider });
}

export async function recordingFile(meetingId: string) {
  const r = await prisma.recording.findUnique({ where: { meetingId } });
  if (!r) throw new NotFound("No recording");
  const abs = path.isAbsolute(r.filePath) ? r.filePath : storageDir(r.filePath);
  if (!fs.existsSync(abs)) throw new NotFound("Recording file missing on disk");
  return { abs, mimeType: r.mimeType, size: fs.statSync(abs).size };
}

// ------------------------------------------------------------------ highlights / action items / comments / shares

export const HighlightInput = z.object({
  typeId: z.string().default("highlight"),
  start: z.number().min(0),
  end: z.number().min(0),
  title: z.string().min(1).max(500),
  segmentIds: z.array(z.string()).optional(),
  kind: z.enum(["highlight", "bookmark"]).default("highlight"),
});

export async function addHighlight(meetingId: string, input: z.infer<typeof HighlightInput>) {
  const me = await currentUser();
  const h = await prisma.highlight.create({
    data: { meetingId, typeKey: input.typeId, start: input.start, end: Math.max(input.end, input.start + 1), title: input.title, segmentIds: input.segmentIds ?? [], kind: input.kind === "bookmark" ? "BOOKMARK" : "HIGHLIGHT", createdById: me.id, source: "MANUAL" },
  });
  return getMeeting(meetingId).then((m) => ({ meeting: m, highlightId: h.id }));
}

export async function removeHighlight(meetingId: string, highlightId: string) {
  await prisma.highlight.deleteMany({ where: { id: highlightId, meetingId } });
  return getMeeting(meetingId);
}

export const ActionItemInput = z.object({ text: z.string().min(1).max(500), at: z.number().min(0).optional(), assigneeId: z.string().optional() });

export async function addActionItem(meetingId: string, input: z.infer<typeof ActionItemInput>) {
  const assignee = input.assigneeId ? await prisma.user.findUnique({ where: { id: input.assigneeId } }) : null;
  await prisma.actionItem.create({ data: { meetingId, text: input.text, at: input.at, assigneeId: assignee?.id, assigneeName: assignee?.name, source: "MANUAL", order: 1000 } });
  return getMeeting(meetingId);
}

export async function toggleActionItem(meetingId: string, itemId: string) {
  const a = await prisma.actionItem.findFirst({ where: { id: itemId, meetingId } });
  if (!a) throw new NotFound("Action item not found");
  await prisma.actionItem.update({ where: { id: itemId }, data: { done: !a.done } });
  return getMeeting(meetingId);
}

export async function removeActionItem(meetingId: string, itemId: string) {
  await prisma.actionItem.deleteMany({ where: { id: itemId, meetingId } });
  return getMeeting(meetingId);
}

export async function addComment(meetingId: string, text: string, at?: number) {
  const me = await currentUser();
  await prisma.comment.create({ data: { meetingId, authorId: me.id, text: z.string().min(1).max(2000).parse(text), at } });
  return getMeeting(meetingId);
}

export const ShareInput = z.object({ kind: z.enum(["user", "team", "email"]), target: z.string().min(1), label: z.string().min(1), sublabel: z.string().default(""), role: z.enum(["admin", "standard", "limited"]).default("standard") });

export async function addShare(meetingId: string, input: z.infer<typeof ShareInput>) {
  await prisma.share.upsert({
    where: { meetingId_target: { meetingId, target: input.target } },
    create: { meetingId, kind: input.kind.toUpperCase() as never, target: input.target, label: input.label, sublabel: input.sublabel, role: input.role.toUpperCase() as never },
    update: { role: input.role.toUpperCase() as never },
  });
  return getMeeting(meetingId);
}

export async function setShareRole(meetingId: string, shareId: string, role: "admin" | "standard" | "limited") {
  await prisma.share.updateMany({ where: { id: shareId, meetingId, NOT: { role: "OWNER" } }, data: { role: role.toUpperCase() as never } });
  return getMeeting(meetingId);
}

export async function removeShare(meetingId: string, shareId: string) {
  await prisma.share.deleteMany({ where: { id: shareId, meetingId, NOT: { role: "OWNER" } } });
  return getMeeting(meetingId);
}

// ------------------------------------------------------------------ transcript edits

export async function editSegment(meetingId: string, segmentId: string, patch: { text?: string; speakerId?: string }) {
  const seg = await prisma.transcriptSegment.findFirst({ where: { id: segmentId, transcript: { meetingId } } });
  if (!seg) throw new NotFound("Segment not found");
  await prisma.transcriptSegment.update({ where: { id: segmentId }, data: { text: patch.text !== undefined ? z.string().min(1).parse(patch.text) : undefined, speakerId: patch.speakerId } });
  return getMeeting(meetingId);
}

export async function trimSegments(meetingId: string, segmentIds: string[]) {
  await prisma.transcriptSegment.updateMany({ where: { id: { in: segmentIds }, transcript: { meetingId } }, data: { trimmed: true } });
  await jobLog(meetingId, "api", "Transcript trimmed", { segments: segmentIds.length });
  return getMeeting(meetingId);
}

// ------------------------------------------------------------------ clips

export async function createClip(meetingId: string, input: { start: number; end: number; title?: string; highlightId?: string }) {
  const rec = await prisma.recording.findUnique({ where: { meetingId } });
  const clip = await prisma.clip.create({
    data: { meetingId, highlightId: input.highlightId, title: input.title ?? "Clip", start: input.start, end: Math.max(input.end, input.start + 1), status: rec ? "PENDING" : "FAILED", error: rec ? null : "No recording for this meeting" },
  });
  if (rec) {
    const src = path.isAbsolute(rec.filePath) ? rec.filePath : storageDir(rec.filePath);
    const out = storageDir("clips", `${clip.id}.mp3`);
    try {
      await cut(src, out, clip.start, clip.end);
      await prisma.clip.update({ where: { id: clip.id }, data: { filePath: path.relative(storageDir(), out).replace(/\\/g, "/"), mimeType: "audio/mpeg", status: "READY" } });
      log.info("clip", "clip rendered", { clip: clip.id, seconds: Math.round(clip.end - clip.start) });
    } catch (e) {
      await prisma.clip.update({ where: { id: clip.id }, data: { status: "FAILED", error: (e as Error).message.slice(0, 300) } });
    }
  }
  return prisma.clip.findUnique({ where: { id: clip.id } });
}

export async function clipFile(clipId: string) {
  const c = await prisma.clip.findUnique({ where: { id: clipId } });
  if (!c || !c.filePath || c.status !== "READY") throw new NotFound("Clip not ready");
  const abs = storageDir(c.filePath);
  if (!fs.existsSync(abs)) throw new NotFound("Clip file missing");
  return { abs, mimeType: c.mimeType ?? "audio/mpeg", size: fs.statSync(abs).size, clip: c };
}

// ------------------------------------------------------------------ library + settings

export async function bootstrap() {
  const ws = await defaultWorkspace();
  const me = await currentUser();
  const [meetings, folders, playlists, alerts, types] = await Promise.all([
    listMeetings(),
    prisma.folder.findMany({ where: { workspaceId: ws.id }, include: { meetings: { select: { id: true } } } }),
    prisma.playlist.findMany({ where: { workspaceId: ws.id }, include: { clips: { include: { highlight: { select: { id: true, meetingId: true } } }, orderBy: { order: "asc" } } } }),
    prisma.keywordAlert.findMany({ where: { workspaceId: ws.id }, orderBy: { createdAt: "desc" } }),
    prisma.highlightType.findMany({ where: { workspaceId: ws.id }, orderBy: { order: "asc" } }),
  ]);
  return {
    currentUserId: me.id,
    meetings,
    folders: folders.map((f) => ({ id: f.id, name: f.name, meetingIds: f.meetings.map((m) => m.id), ownerId: f.ownerId, teamId: f.teamId ?? undefined })),
    playlists: playlists.map((p) => ({ id: p.id, name: p.name, description: p.description ?? undefined, ownerId: p.ownerId, clipIds: p.clips.map((c) => ({ meetingId: c.highlight.meetingId, highlightId: c.highlightId })) })),
    alerts: alerts.map((a) => ({ id: a.id, keyword: a.keyword, scope: a.scope.toLowerCase() as "my_calls" | "team_calls", notify: a.notify.toLowerCase() as "email" | "slack", matchCount: 0, createdAt: a.createdAt.toISOString() })),
    highlightTypes: types.map(toUiHighlightType),
    settings: (me.settings as Record<string, unknown> | null) ?? {},
  };
}

export async function saveSettings(patch: Record<string, unknown>) {
  const me = await currentUser();
  const merged = { ...((me.settings as Record<string, unknown> | null) ?? {}), ...patch };
  await prisma.user.update({ where: { id: me.id }, data: { settings: merged as Prisma.InputJsonValue } });
  return merged;
}

// ------------------------------------------------------------------ search

export async function search(q: string, limit = 40) {
  const term = q.trim();
  if (term.length < 2) return [];
  const like = `%${term}%`;
  const [meetings, segments, highlights] = await Promise.all([
    prisma.meeting.findMany({
      where: {
        status: "COMPLETED",
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { participants: { some: { name: { contains: term, mode: "insensitive" } } } },
          { topics: { some: { title: { contains: term, mode: "insensitive" } } } },
          { decisions: { some: { text: { contains: term, mode: "insensitive" } } } },
          { actionItems: { some: { text: { contains: term, mode: "insensitive" } } } },
        ],
      },
      select: { id: true, title: true, startedAt: true, participants: { select: { name: true } } },
      take: limit,
    }),
    prisma.$queryRaw<{ id: string; meetingId: string; title: string; start: number; text: string; speaker: string }[]>`
      SELECT s.id, m.id AS "meetingId", m.title, s.start, s.text, sp.name AS speaker
      FROM "TranscriptSegment" s
      JOIN "Transcript" t ON t.id = s."transcriptId"
      JOIN "Meeting" m ON m.id = t."meetingId"
      JOIN "Speaker" sp ON sp.id = s."speakerId"
      WHERE s.trimmed = false AND m.status = 'COMPLETED' AND s.text ILIKE ${like}
      ORDER BY m."startedAt" DESC, s.start ASC
      LIMIT ${limit}`,
    prisma.highlight.findMany({
      where: { meeting: { status: "COMPLETED" }, OR: [{ title: { contains: term, mode: "insensitive" } }, { text: { contains: term, mode: "insensitive" } }] },
      select: { id: true, meetingId: true, title: true, start: true, meeting: { select: { title: true } } },
      take: limit,
    }),
  ]);
  return [
    ...meetings.map((m) => ({ kind: "meeting" as const, meetingId: m.id, title: m.title, startedAt: m.startedAt.toISOString(), participants: m.participants.map((p) => p.name) })),
    ...highlights.map((h) => ({ kind: "highlight" as const, meetingId: h.meetingId, meetingTitle: h.meeting.title, highlightId: h.id, title: h.title, at: h.start })),
    ...segments.map((s) => ({ kind: "transcript" as const, meetingId: s.meetingId, meetingTitle: s.title, segmentId: s.id, at: Number(s.start), text: s.text, speaker: s.speaker })),
  ];
}
