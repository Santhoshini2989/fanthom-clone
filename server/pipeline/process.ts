import fs from "node:fs";
import path from "node:path";
import { prisma, jobLog } from "../db";
import { env, storageDir } from "../env";
import { log, errorMessage } from "../logger";
import { setStep, transition } from "../meetings/state";
import { transcribeRecording } from "../ai/transcribe";
import { analyzeTranscript } from "../ai/analyze";
import { hasGeminiKey } from "../env";
import { probeDuration } from "../audio/ffmpeg";
import type { Analysis } from "../ai/schemas";

/**
 * Recording → transcript → intelligence → database.
 *
 *   PROCESSING   normalise audio, chunk
 *   TRANSCRIBING gemini-3.5-transcribe per chunk, merge
 *   ANALYZING    gemini-2.5-flash structured JSON, validate
 *   COMPLETED    everything persisted
 * Any failure → FAILED with the error message stored on the meeting; the UI
 * offers Retry which re-enters at PROCESSING.
 */
const SPEAKER_COLORS = ["#6d3df5", "#0ea5e9", "#f59e0b", "#10b981", "#ec4899", "#f97316", "#14b8a6", "#a855f7"];

const running = new Set<string>();

export async function processMeeting(meetingId: string): Promise<void> {
  if (running.has(meetingId)) {
    log.warn("pipeline", "already processing", { meetingId });
    return;
  }
  running.add(meetingId);
  try {
    await runPipeline(meetingId);
  } finally {
    running.delete(meetingId);
  }
}

async function runPipeline(meetingId: string) {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId }, include: { recording: true, participants: true } });
  if (!meeting) throw new Error(`Meeting ${meetingId} not found`);
  if (!meeting.recording) {
    await transition(meetingId, "FAILED", { error: "No recording attached to this meeting", stage: "pipeline" });
    return;
  }
  if (!hasGeminiKey()) {
    await transition(meetingId, "FAILED", { error: "GEMINI_API_KEY is not set. Add it to .env and click Retry.", stage: "pipeline" });
    return;
  }
  const file = path.isAbsolute(meeting.recording.filePath) ? meeting.recording.filePath : storageDir(meeting.recording.filePath);
  if (!fs.existsSync(file)) {
    await transition(meetingId, "FAILED", { error: `Recording file missing: ${meeting.recording.filePath}`, stage: "pipeline" });
    return;
  }
  const workDir = storageDir("work", meetingId);

  try {
    await transition(meetingId, "PROCESSING", { step: "Preparing audio", stage: "pipeline" });
    const duration = meeting.recording.duration || (await probeDuration(file));
    await prisma.recording.update({ where: { id: meeting.recording.id }, data: { duration } });

    await transition(meetingId, "TRANSCRIBING", { step: "Transcribing", stage: "transcription" });
    const transcript = await transcribeRecording(file, workDir, (step) => setStep(meetingId, step));
    await persistTranscript(meetingId, transcript.segments, env().GEMINI_TRANSCRIBE_MODEL);
    await jobLog(meetingId, "transcription", "Transcript persisted", { segments: transcript.segments.length });

    await transition(meetingId, "ANALYZING", { step: "Generating meeting intelligence", stage: "analysis" });
    const analysis = await analyzeTranscript(transcript.segments, {
      title: meeting.title,
      participants: meeting.participants.map((p) => p.name),
      durationSeconds: transcript.duration,
    });
    await persistAnalysis(meetingId, analysis, env().GEMINI_ANALYSIS_MODEL);
    await prisma.meeting.update({ where: { id: meetingId }, data: { duration: Math.round(transcript.duration) } });

    await transition(meetingId, "COMPLETED", { stage: "db" });
    cleanupWork(workDir);
  } catch (e) {
    const msg = errorMessage(e);
    log.error("pipeline", "processing failed", { meetingId, error: msg });
    await transition(meetingId, "FAILED", { error: msg.slice(0, 500), stage: "pipeline" }).catch(() => {});
  }
}

function cleanupWork(dir: string) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

/** Replace the transcript for a meeting (idempotent re-runs). */
export async function persistTranscript(meetingId: string, segments: { speaker: string; start: number; end: number; text: string }[], model?: string) {
  const labels = Array.from(new Set(segments.map((s) => s.speaker)));
  await prisma.$transaction(async (tx) => {
    await tx.transcript.deleteMany({ where: { meetingId } });
    const t = await tx.transcript.create({ data: { meetingId, language: "en", model } });
    const speakerIds = new Map<string, string>();
    for (const [i, label] of labels.entries()) {
      const sp = await tx.speaker.create({
        data: { transcriptId: t.id, label, name: prettySpeaker(label, i), color: SPEAKER_COLORS[i % SPEAKER_COLORS.length]! },
      });
      speakerIds.set(label, sp.id);
    }
    await tx.transcriptSegment.createMany({
      data: segments.map((s, i) => ({ transcriptId: t.id, speakerId: speakerIds.get(s.speaker)!, index: i, start: s.start, end: s.end, text: s.text })),
    });
  });
}

function prettySpeaker(label: string, i: number) {
  const m = label.match(/(\d+)/);
  return `Speaker ${m ? m[1] : i + 1}`;
}

/** Replace AI-generated intelligence, keeping manual action items/highlights. */
export async function persistAnalysis(meetingId: string, a: Analysis, model?: string) {
  const summarySections = [
    { heading: "Meeting Purpose", paragraph: a.meetingPurpose },
    { heading: "Key Takeaways", bullets: a.summary.map((b) => ({ text: b.text, at: b.timestamp ?? undefined })) },
    ...(a.followUps.length ? [{ heading: "Next Steps", bullets: a.followUps.map((b) => ({ text: b.text, at: b.timestamp ?? undefined })) }] : []),
  ];
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId }, include: { participants: true, transcript: { include: { speakers: true, segments: true } } } });
  const participantIdByName = new Map(meeting?.participants.map((p) => [p.name.toLowerCase(), p.userId ?? null]) ?? []);

  await prisma.$transaction(async (tx) => {
    await tx.meetingSummary.upsert({
      where: { meetingId_templateId_language: { meetingId, templateId: "general", language: "en" } },
      create: { meetingId, templateId: "general", language: "en", sections: summarySections, model },
      update: { sections: summarySections, model, customized: false },
    });
    await tx.topic.deleteMany({ where: { meetingId } });
    await tx.topic.createMany({ data: a.topics.map((t, i) => ({ meetingId, order: i, title: t.title, bullets: t.bullets.map((b) => ({ text: b.text, at: b.timestamp ?? null })) })) });
    await tx.decision.deleteMany({ where: { meetingId } });
    await tx.decision.createMany({ data: a.decisions.map((d, i) => ({ meetingId, order: i, text: d.text, at: d.timestamp ?? null })) });
    await tx.actionItem.deleteMany({ where: { meetingId, source: "AI" } });
    await tx.actionItem.createMany({
      data: [
        ...a.actionItems.map((x, i) => ({
          meetingId,
          order: i,
          text: x.task,
          assigneeName: x.assignee ?? null,
          assigneeId: x.assignee ? participantIdByName.get(x.assignee.toLowerCase()) ?? matchByFirstName(participantIdByName, x.assignee) : null,
          dueDate: x.dueDate ?? null,
          at: x.timestamp ?? null,
          source: "AI" as const,
        })),
        ...a.followUps.map((x, i) => ({ meetingId, order: 100 + i, text: x.text, at: x.timestamp ?? null, source: "AI" as const, isFollowUp: true })),
      ],
    });
    await tx.highlight.deleteMany({ where: { meetingId, source: "AI" } });
    const segs = meeting?.transcript?.segments ?? [];
    await tx.highlight.createMany({
      data: a.highlights.map((h) => ({
        meetingId,
        typeKey: h.type ?? "highlight",
        start: h.startTime,
        end: h.endTime,
        title: h.reason,
        text: h.text,
        reason: h.reason,
        source: "AI" as const,
        segmentIds: segs.filter((s) => s.start >= h.startTime - 0.5 && s.start < h.endTime).map((s) => s.id),
      })),
    });
    await tx.question.deleteMany({ where: { meetingId } });
    if (a.questions?.length) {
      await tx.question.createMany({ data: a.questions.map((q) => ({ meetingId, text: q.text, at: q.timestamp ?? 0, askedBy: q.askedBy ?? null })) });
    }
    if (a.speakerNames?.length && meeting?.transcript) {
      for (const s of a.speakerNames) {
        if (!s.name) continue;
        const sp = meeting.transcript.speakers.find((x) => x.label === s.label);
        if (sp) await tx.speaker.update({ where: { id: sp.id }, data: { name: s.name } });
      }
    }
    if (a.title && meeting && /^(untitled|meeting|google meet|new meeting)/i.test(meeting.title)) {
      await tx.meeting.update({ where: { id: meetingId }, data: { title: a.title } });
    }
  });
}

function matchByFirstName(map: Map<string, string | null>, name: string): string | null {
  const first = name.toLowerCase().split(/\s+/)[0];
  for (const [full, id] of map) if (full.split(/\s+/)[0] === first) return id;
  return null;
}
