import { PrismaClient } from "@prisma/client";
import { log, type Stage } from "./logger";

/**
 * Prisma client singleton (survives Next.js dev hot reloads) shared by the
 * API routes, the bot process and the CLI scripts.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.PRISMA_LOG === "query" ? ["query", "warn", "error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Console log + durable JobEvent row so the UI can show pipeline history. */
export async function jobLog(meetingId: string, stage: Stage, message: string, data?: Record<string, unknown>, level: "info" | "warn" | "error" = "info") {
  log[level](stage, `${message} (meeting ${meetingId})`, data);
  try {
    await prisma.jobEvent.create({ data: { meetingId, stage, level, message, data: data as object | undefined } });
  } catch (e) {
    log.warn("db", "could not persist job event", { error: (e as Error).message });
  }
}

export async function assertDatabase(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    throw new Error(
      `Cannot reach PostgreSQL at DATABASE_URL. Start it with "npm run db:start" (embedded) or check your server. (${(e as Error).message.split("\n")[0]})`,
    );
  }
}
