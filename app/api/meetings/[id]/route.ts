import { handler, ok, readJson, type Params } from "@/server/http";
import { deleteMeeting, getMeeting, updateMeeting } from "@/server/meetings/service";

export const dynamic = "force-dynamic";

export const GET = handler(async (_req, { params }: Params<{ id: string }>) => ok(await getMeeting((await params).id)));

export const PATCH = handler(async (req, { params }: Params<{ id: string }>) => {
  const body = await readJson<{ title?: string; visibility?: string; shareAccess?: string; folderId?: string | null; meetUrl?: string }>(req);
  return ok(await updateMeeting((await params).id, body));
});

export const DELETE = handler(async (_req, { params }: Params<{ id: string }>) => {
  await deleteMeeting((await params).id);
  return ok({ ok: true });
});
