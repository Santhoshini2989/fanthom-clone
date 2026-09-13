import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { BadRequest, NotFound } from "./meetings/service";
import { InvalidTransition } from "./meetings/state";
import { GeminiConfigError } from "./ai/gemini";
import { log } from "./logger";

/** Uniform JSON + error handling for route handlers. */
export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(e: unknown) {
  if (e instanceof ZodError) return NextResponse.json({ error: e.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ") }, { status: 400 });
  if (e instanceof BadRequest || e instanceof InvalidTransition) return NextResponse.json({ error: e.message }, { status: 400 });
  if (e instanceof NotFound) return NextResponse.json({ error: e.message }, { status: 404 });
  if (e instanceof GeminiConfigError) return NextResponse.json({ error: e.message, code: "GEMINI_KEY_MISSING" }, { status: 503 });
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
  if (e instanceof Prisma.PrismaClientInitializationError || (e instanceof Error && /ECONNREFUSED|Can't reach database|Cannot reach PostgreSQL/i.test(e.message))) {
    return NextResponse.json({ error: "Database is not reachable. Start it with `npm run db:start` (or fix DATABASE_URL) and run `npm run db:migrate`.", code: "DB_DOWN" }, { status: 503 });
  }
  if (e instanceof Error && /does not exist|relation .* does not exist|P2021/i.test(e.message)) {
    return NextResponse.json({ error: "Database schema missing. Run `npm run db:migrate` then `npm run db:seed`.", code: "DB_NOT_MIGRATED" }, { status: 503 });
  }
  const message = e instanceof Error ? e.message : String(e);
  log.error("api", "unhandled", { error: message });
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}

/** Route handler wrapper: `export const GET = handler(async (req, ctx) => ...)` */
export function handler<C>(fn: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      return fail(e);
    }
  };
}

export type Params<T extends Record<string, string>> = { params: Promise<T> };
