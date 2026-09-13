import { handler, ok, readJson } from "@/server/http";
import { currentUser, saveSettings } from "@/server/meetings/service";

export const dynamic = "force-dynamic";

export const GET = handler(async () => ok(((await currentUser()).settings as Record<string, unknown> | null) ?? {}));
export const PATCH = handler(async (req) => ok(await saveSettings(await readJson(req))));
