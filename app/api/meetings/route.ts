import { handler, ok, readJson } from "@/server/http";
import { CreateMeetingSchema, createMeeting, listMeetings } from "@/server/meetings/service";

export const dynamic = "force-dynamic";

export const GET = handler(async () => ok(await listMeetings()));

/** POST { title?, meetUrl?, startNow? } → creates the meeting; with a Meet URL and startNow it enters BOT_REQUESTED. */
export const POST = handler(async (req) => {
  const input = CreateMeetingSchema.parse(await readJson(req));
  const meeting = await createMeeting(input);
  return ok(meeting, { status: 201 });
});
