import { NextResponse } from "next/server";
import { z } from "zod";
import { handler, ok, readJson, type Params } from "@/server/http";
import * as svc from "@/server/meetings/service";
import { processMeeting } from "@/server/pipeline/process";
import { prisma } from "@/server/db";
import { summarizeWithTemplate, askOverTranscripts } from "@/server/ai/analyze";
import { hasGeminiKey } from "@/server/env";

export const dynamic = "force-dynamic";

type Ctx = Params<{ id: string; action: string }>;

/**
 * Sub-resources and commands on a meeting:
 *   GET   status | transcript | summary | action-items | highlights | clips | events
 *   POST  start-bot | stop | retry | process | highlights | action-items | comments |
 *         shares | clips | transcript (edit / trim) | summary (regenerate) | ask
 *   PATCH action-items (toggle) | shares (role)      DELETE highlights | action-items | shares
 */
export const GET = handler(async (_req, { params }: Ctx) => {
  const { id, action } = await params;
  switch (action) {
    case "status":
      return ok(await svc.meetingStatus(id));
    case "transcript": {
      const m = await svc.getMeeting(id);
      return ok({ speakers: m.speakers, segments: m.transcript });
    }
    case "summary":
      return ok((await svc.getMeeting(id)).summaries);
    case "action-items":
      return ok((await svc.getMeeting(id)).actionItems);
    case "highlights":
      return ok((await svc.getMeeting(id)).highlights);
    case "clips":
      return ok(await prisma.clip.findMany({ where: { meetingId: id }, orderBy: { createdAt: "desc" } }));
    case "events":
      return ok(await prisma.jobEvent.findMany({ where: { meetingId: id }, orderBy: { createdAt: "asc" } }));
    default:
      return NextResponse.json({ error: `Unknown action ${action}` }, { status: 404 });
  }
});

export const POST = handler(async (req, { params }: Ctx) => {
  const { id, action } = await params;
  const body = await readJson<Record<string, unknown>>(req);
  switch (action) {
    case "start-bot":
      return ok(await svc.requestBot(id));
    case "stop":
      return ok(await svc.requestStop(id));
    case "retry": {
      const r = await svc.retryMeeting(id);
      if (r.mode === "process") void processMeeting(id);
      return ok(r.meeting);
    }
    case "process": {
      const row = await prisma.meeting.findUnique({ where: { id }, include: { recording: true } });
      if (!row) throw new svc.NotFound("Meeting not found");
      if (!row.recording) throw new svc.BadRequest("No recording to process");
      void processMeeting(id);
      return ok({ ok: true });
    }
    case "highlights":
      return ok(await svc.addHighlight(id, svc.HighlightInput.parse(body)));
    case "action-items":
      return ok(await svc.addActionItem(id, svc.ActionItemInput.parse(body)));
    case "comments":
      return ok(await svc.addComment(id, String(body.text ?? ""), typeof body.at === "number" ? body.at : undefined));
    case "shares":
      return ok(await svc.addShare(id, svc.ShareInput.parse(body)));
    case "clips": {
      const input = z.object({ start: z.number().min(0), end: z.number().min(0), title: z.string().optional(), highlightId: z.string().optional() }).parse(body);
      return ok(await svc.createClip(id, input), { status: 201 });
    }
    case "transcript": {
      if (Array.isArray(body.trimSegmentIds)) return ok(await svc.trimSegments(id, body.trimSegmentIds as string[]));
      const input = z.object({ segmentId: z.string(), text: z.string().optional(), speakerId: z.string().optional() }).parse(body);
      return ok(await svc.editSegment(id, input.segmentId, input));
    }
    case "summary": {
      const input = z.object({ templateId: z.string().default("general"), instructions: z.string().max(2000).optional(), language: z.string().default("en") }).parse(body);
      if (!hasGeminiKey()) return NextResponse.json({ error: "GEMINI_API_KEY is not set. Add it to .env to generate summaries.", code: "GEMINI_KEY_MISSING" }, { status: 503 });
      const m = await svc.getMeeting(id);
      if (!m.transcript.length) throw new svc.BadRequest("This meeting has no transcript yet");
      const speakerNames = Object.fromEntries(m.speakers.map((s) => [s.id, s.name]));
      const segs = m.transcript.map((s) => ({ speaker: s.speakerId, start: s.start, end: s.end, text: s.text }));
      const out = await summarizeWithTemplate(segs, input.templateId, { title: m.title, speakerNames, instructions: input.instructions, language: input.language });
      const sections = out.sections.map((s) => ({ heading: s.heading, paragraph: s.paragraph ?? undefined, bullets: s.bullets?.map((b) => ({ lead: b.lead ?? undefined, text: b.text, at: b.timestamp ?? undefined })) }));
      await prisma.meetingSummary.upsert({
        where: { meetingId_templateId_language: { meetingId: id, templateId: input.templateId, language: input.language } },
        create: { meetingId: id, templateId: input.templateId, language: input.language, sections, customized: !!input.instructions },
        update: { sections, customized: !!input.instructions },
      });
      return ok(await svc.getMeeting(id));
    }
    case "ask": {
      const input = z.object({ question: z.string().min(2).max(1000) }).parse(body);
      if (!hasGeminiKey()) return NextResponse.json({ error: "GEMINI_API_KEY is not set.", code: "GEMINI_KEY_MISSING" }, { status: 503 });
      const m = await svc.getMeeting(id);
      const speakerNames = Object.fromEntries(m.speakers.map((s) => [s.id, s.name]));
      return ok(
        await askOverTranscripts(input.question, [
          { meetingId: m.id, title: m.title, segments: m.transcript.map((s) => ({ speaker: s.speakerId, start: s.start, end: s.end, text: s.text })), speakerNames },
        ]),
      );
    }
    default:
      return NextResponse.json({ error: `Unknown action ${action}` }, { status: 404 });
  }
});

export const PATCH = handler(async (req, { params }: Ctx) => {
  const { id, action } = await params;
  const body = await readJson<Record<string, unknown>>(req);
  switch (action) {
    case "action-items":
      return ok(await svc.toggleActionItem(id, String(body.itemId)));
    case "shares":
      return ok(await svc.setShareRole(id, String(body.shareId), z.enum(["admin", "standard", "limited"]).parse(body.role)));
    default:
      return NextResponse.json({ error: `Unknown action ${action}` }, { status: 404 });
  }
});

export const DELETE = handler(async (req, { params }: Ctx) => {
  const { id, action } = await params;
  const body = await readJson<Record<string, unknown>>(req);
  switch (action) {
    case "highlights":
      return ok(await svc.removeHighlight(id, String(body.highlightId)));
    case "action-items":
      return ok(await svc.removeActionItem(id, String(body.itemId)));
    case "shares":
      return ok(await svc.removeShare(id, String(body.shareId)));
    default:
      return NextResponse.json({ error: `Unknown action ${action}` }, { status: 404 });
  }
});
