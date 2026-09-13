/**
 * Seed the local database with the demo dataset the UI was built against
 * (data/meetings): 14 meetings incl. processing/failed states, users, teams,
 * folders, playlists, alerts and highlight types.  `npm run db:seed`
 * Idempotent: wipes workspace data and re-creates it.
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import { MEETINGS, FOLDERS, PLAYLISTS, ALERTS, HIGHLIGHT_TYPES } from "../data/meetings";
import { USERS, TEAMS, ORG } from "../data/users";
import { TEMPLATES } from "../data/templates";

const prisma = new PrismaClient();

const STATUS: Record<string, Prisma.MeetingCreateInput["status"]> = {
  scheduled: "SCHEDULED",
  recording: "RECORDING",
  processing: "TRANSCRIBING",
  ready: "COMPLETED",
  failed: "FAILED",
};
const PLATFORM: Record<string, Prisma.MeetingCreateInput["platform"]> = {
  zoom: "ZOOM",
  google_meet: "GOOGLE_MEET",
  microsoft_teams: "MICROSOFT_TEAMS",
  slack_huddle: "SLACK_HUDDLE",
  in_person: "IN_PERSON",
};

async function main() {
  console.log("[seed] resetting workspace data");
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  const ws = await prisma.workspace.create({ data: { name: ORG.name, domain: ORG.domain, plan: ORG.plan } });

  for (const u of USERS) {
    await prisma.user.create({
      data: { id: u.id, workspaceId: u.isExternal ? null : ws.id, name: u.name, email: u.email, pronouns: u.pronouns, title: u.title, avatarColor: u.avatarColor, isExternal: !!u.isExternal },
    });
  }
  for (const t of TEAMS) {
    await prisma.team.create({ data: { id: t.id, workspaceId: ws.id, name: t.name, members: { create: t.memberIds.map((userId) => ({ userId, role: userId === "u_nancy" || userId === "u_marcus" ? "admin" : "member" })) } } });
  }
  for (const [i, h] of HIGHLIGHT_TYPES.entries()) {
    await prisma.highlightType.create({ data: { workspaceId: ws.id, key: h.id, name: h.name, color: h.color, builtIn: !!h.builtIn, order: i } });
  }
  for (const f of FOLDERS) {
    await prisma.folder.create({ data: { id: f.id, workspaceId: ws.id, ownerId: f.ownerId, teamId: f.teamId, name: f.name } });
  }

  const userById = new Map(USERS.map((u) => [u.id, u]));

  for (const m of MEETINGS) {
    const speakerIds = new Map<string, string>();
    const meeting = await prisma.meeting.create({
      data: {
        id: m.id,
        workspaceId: ws.id,
        ownerId: m.ownerId,
        title: m.title,
        platform: PLATFORM[m.platform] ?? "GOOGLE_MEET",
        status: STATUS[m.status] ?? "COMPLETED",
        processingStep: m.status === "processing" ? "Identifying speakers" : null,
        errorMessage: m.failureReason ?? null,
        startedAt: new Date(m.startedAt),
        endedAt: m.status === "ready" ? new Date(new Date(m.startedAt).getTime() + m.duration * 1000) : null,
        duration: m.duration,
        visibility: m.visibility.toUpperCase() as never,
        shareAccess: m.shareAccess.toUpperCase() as never,
        meetingType: m.meetingType,
        dealName: m.dealName,
        crmSynced: m.crmSynced,
        thumbnailSeed: m.thumbnailSeed,
        folderId: m.folderId,
        participants: {
          create: m.attendeeIds.map((uid) => {
            const u = userById.get(uid)!;
            return { userId: uid, name: u.name, email: u.email, isHost: uid === m.ownerId, isExternal: !!u.isExternal };
          }),
        },
        shares: { create: m.shares.map((s) => ({ kind: s.kind.toUpperCase() as never, target: s.target, label: s.label, sublabel: s.sublabel, role: s.role.toUpperCase() as never })) },
        questions: { create: m.questions.map((q) => ({ text: q.text, at: q.at, askedBy: q.askedById })) },
        comments: { create: m.comments.map((c) => ({ authorId: c.authorId, text: c.text, at: c.at, createdAt: new Date(c.createdAt) })) },
      },
    });

    if (m.transcript.length) {
      const t = await prisma.transcript.create({ data: { meetingId: meeting.id, language: "en", model: "seed" } });
      for (const [i, sp] of m.speakers.entries()) {
        const created = await prisma.speaker.create({
          data: { transcriptId: t.id, label: `speaker_${i + 1}`, name: sp.name, pronouns: sp.pronouns, color: sp.color },
        });
        speakerIds.set(sp.id, created.id);
      }
      const segRows = m.transcript.map((s, i) => ({ id: s.id, transcriptId: t.id, speakerId: speakerIds.get(s.speakerId)!, index: i, start: s.start, end: s.end, text: s.text }));
      await prisma.transcriptSegment.createMany({ data: segRows });
    }

    for (const [templateId, s] of Object.entries(m.summaries)) {
      const sections = s.sections.filter((sec) => sec.heading !== "Topics");
      await prisma.meetingSummary.create({ data: { meetingId: meeting.id, templateId, language: s.language, sections: sections as never, model: "seed" } });
      const topics = s.sections.find((sec) => sec.heading === "Topics")?.topics ?? [];
      if (templateId === "general" && topics.length) {
        await prisma.topic.createMany({ data: topics.map((tp, i) => ({ meetingId: meeting.id, order: i, title: tp.title, bullets: tp.bullets.map((b) => ({ text: b.text, at: b.at ?? null })) })) });
      }
    }

    await prisma.actionItem.createMany({
      data: m.actionItems.map((a, i) => ({ id: a.id, meetingId: meeting.id, order: i, text: a.text, assigneeId: a.assigneeId, assigneeName: a.assigneeId ? userById.get(a.assigneeId)?.name : null, at: a.at, done: a.done, source: a.source === "ai" ? "AI" : "MANUAL" })),
    });
    await prisma.highlight.createMany({
      data: m.highlights.map((h) => ({ id: h.id, meetingId: meeting.id, typeKey: h.typeId, kind: h.kind === "bookmark" ? "BOOKMARK" : "HIGHLIGHT", start: h.start, end: h.end, title: h.title, segmentIds: h.segmentIds, createdById: h.createdById, source: "MANUAL" })),
    });
    await prisma.jobEvent.create({ data: { meetingId: meeting.id, stage: "db", message: m.status === "failed" ? `Failed: ${m.failureReason}` : "Seeded demo meeting" } });
  }

  for (const p of PLAYLISTS) {
    await prisma.playlist.create({
      data: { id: p.id, workspaceId: ws.id, ownerId: p.ownerId, name: p.name, description: p.description, clips: { create: p.clipIds.map((c, i) => ({ highlightId: c.highlightId, order: i })) } },
    });
  }
  for (const a of ALERTS) {
    await prisma.keywordAlert.create({ data: { id: a.id, workspaceId: ws.id, keyword: a.keyword, scope: a.scope.toUpperCase() as never, notify: a.notify.toUpperCase() as never, createdAt: new Date(a.createdAt) } });
  }
  await prisma.user.update({ where: { id: "u_nancy" }, data: { settings: { defaultTemplateId: TEMPLATES[1]!.id } } });

  const counts = await Promise.all([prisma.meeting.count(), prisma.transcriptSegment.count(), prisma.actionItem.count(), prisma.highlight.count()]);
  console.log(`[seed] done: ${counts[0]} meetings, ${counts[1]} transcript segments, ${counts[2]} action items, ${counts[3]} highlights`);
}

main()
  .catch((e) => {
    console.error("[seed] failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
