import { handler, ok } from "@/server/http";
import { bootstrap } from "@/server/meetings/service";
import { hasGeminiKey } from "@/server/env";

export const dynamic = "force-dynamic";

/** Everything the UI store needs on load: meetings, library, settings, capabilities. */
export const GET = handler(async () => {
  const data = await bootstrap();
  return ok({ ...data, capabilities: { gemini: hasGeminiKey() } });
});
