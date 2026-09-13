import type { Prisma } from "@prisma/client";
import type { Meeting as UiMeeting, ProcessingStatus, Summary, SummarySection, Visibility, ShareAccess, Platform, HighlightType as UiHighlightType } from "@/data/types";

/**
 * Translate database rows into the `Meeting` shape the existing UI was built
 * against (data/types.ts), so no component needs to change. The database is
 * the source of truth; this is a read model.
 */
export const meetingInclude = {
  participants: { include: { user: true } },
  recording: true,
  transcript: { include: { speakers: true, segments: { orderBy: { index: "asc" as const } } } },
  summaries: true,
  topics: { orderBy: { order: "asc" as const } },
  decisions: { orderBy: { order: "asc" as const } },
  actionItems: { orderBy: [{ order: "asc" as const }, { createdAt: "asc" as const }] },
  highlights: { orderBy: { start: "asc" as const } },
  clips: true,
  questions: { orderBy: { at: "asc" as const } },
  comments: { orderBy: { createdAt: "asc" as const } },
  shares: true,
} satisfies Prisma.MeetingInclude;

export type MeetingRow = Prisma.MeetingGetPayload<{ include: typeof meetingInclude }>;

const STATUS_TO_UI: Record<string, ProcessingStatus> = {
  SCHEDULED: "scheduled",
  BOT_REQUESTED: "scheduled",
  BOT_JOINING: "recording",
  RECORDING: "recording",
  PROCESSING: "processing",
  TRANSCRIBING: "processing",
  ANALYZING: "processing",
  COMPLETED: "ready",
  FAILED: "failed",
};

const PLATFORM_TO_UI: Record<string, Platform> = {
  GOOGLE_MEET: "google_meet",
  ZOOM: "zoom",
  MICROSOFT_TEAMS: "microsoft_teams",
  SLACK_HUDDLE: "slack_huddle",
  IN_PERSON: "in_person",
};

const PROGRESS: Record<string, number> = { PROCESSING: 20, TRANSCRIBING: 55, ANALYZING: 85 };

export function toUiMeeting(m: MeetingRow): UiMeeting & { db: { status: string; processingStep: string | null; meetUrl: string | null; hasRecording: boolean; recordingProvider: string | null; stopRequested: boolean; botClaimedAt: string | null } } {
  const speakers = (m.transcript?.speakers ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    pronouns: s.pronouns ?? undefined,
    color: s.color,
    userId: m.participants.find((p) => p.id === s.participantId)?.userId ?? undefined,
  }));
  const summaries: Record<string, Summary> = {};
  for (const s of m.summaries) {
    if (s.language !== "en") continue;
    summaries[s.templateId] = { templateId: s.templateId, language: s.language, sections: s.sections as unknown as SummarySection[] };
  }
  // Topics/decisions live in their own tables; fold them into the General summary the UI renders.
  if (summaries.general && (m.topics.length || m.decisions.length)) {
    const sections = [...summaries.general.sections];
    if (m.topics.length && !sections.some((s) => s.heading === "Topics")) {
      sections.push({ heading: "Topics", topics: m.topics.map((t) => ({ title: t.title, bullets: (t.bullets as { text: string; at?: number | null }[]).map((b) => ({ text: b.text, at: b.at ?? undefined })) })) });
    }
    if (m.decisions.length && !sections.some((s) => s.heading === "Decisions")) {
      sections.push({ heading: "Decisions", bullets: m.decisions.map((d) => ({ text: d.text, at: d.at ?? undefined })) });
    }
    summaries.general = { ...summaries.general, sections };
  }

  return {
    id: m.id,
    title: m.title,
    startedAt: m.startedAt.toISOString(),
    duration: m.recording?.duration ? Math.round(m.recording.duration) : m.duration,
    platform: PLATFORM_TO_UI[m.platform] ?? "google_meet",
    status: STATUS_TO_UI[m.status] ?? "ready",
    processingProgress: PROGRESS[m.status],
    failureReason: m.errorMessage ?? undefined,
    ownerId: m.ownerId,
    attendeeIds: m.participants.map((p) => p.userId ?? p.id),
    externalAttendeeIds: m.participants.filter((p) => p.isExternal).map((p) => p.userId ?? p.id),
    speakers,
    transcript: (m.transcript?.segments ?? [])
      .filter((s) => !s.trimmed)
      .map((s) => ({ id: s.id, speakerId: s.speakerId, start: s.start, end: s.end, text: s.text })),
    summaries,
    actionItems: m.actionItems.map((a) => ({
      id: a.id,
      text: a.text,
      assigneeId: a.assigneeId ?? undefined,
      done: a.done,
      at: a.at ?? undefined,
      source: a.source === "AI" ? "ai" : "manual",
    })),
    highlights: m.highlights.map((h) => ({
      id: h.id,
      typeId: h.typeKey,
      start: h.start,
      end: h.end,
      title: h.title,
      createdById: h.createdById ?? m.ownerId,
      segmentIds: (h.segmentIds as string[] | null) ?? [],
      kind: h.kind === "BOOKMARK" ? "bookmark" : "highlight",
    })),
    questions: m.questions.map((q) => ({ id: q.id, text: q.text, at: q.at, askedById: q.askedBy ?? m.ownerId })),
    comments: m.comments.map((c) => ({ id: c.id, authorId: c.authorId, text: c.text, at: c.at ?? undefined, createdAt: c.createdAt.toISOString() })),
    visibility: m.visibility.toLowerCase() as Visibility,
    shareAccess: m.shareAccess.toLowerCase() as ShareAccess,
    shares: m.shares.map((s) => ({ id: s.id, target: s.target, label: s.label, sublabel: s.sublabel, role: s.role.toLowerCase() as "owner" | "admin" | "standard" | "limited", kind: s.kind.toLowerCase() as "user" | "team" | "email" })),
    folderId: m.folderId ?? undefined,
    meetingType: m.meetingType ?? undefined,
    dealName: m.dealName ?? undefined,
    crmSynced: (m.crmSynced as "hubspot" | "salesforce" | null) ?? undefined,
    thumbnailSeed: m.thumbnailSeed,
    db: {
      status: m.status,
      processingStep: m.processingStep,
      meetUrl: m.meetUrl,
      hasRecording: !!m.recording,
      recordingProvider: m.recording?.provider ?? null,
      stopRequested: m.stopRequested,
      botClaimedAt: m.botClaimedAt?.toISOString() ?? null,
    },
  };
}

export function toUiHighlightType(t: { key: string; name: string; color: string; builtIn: boolean }): UiHighlightType {
  return { id: t.key, name: t.name, color: t.color, builtIn: t.builtIn };
}
