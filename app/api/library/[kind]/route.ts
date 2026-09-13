import { NextResponse } from "next/server";
import { z } from "zod";
import { handler, ok, readJson, type Params } from "@/server/http";
import { prisma } from "@/server/db";
import { currentUser, defaultWorkspace } from "@/server/meetings/service";

export const dynamic = "force-dynamic";
type Ctx = Params<{ kind: string }>;

/** folders | playlists | playlist-clips | alerts | highlight-types — create / update / delete. */
export const POST = handler(async (req, { params }: Ctx) => {
  const { kind } = await params;
  const ws = await defaultWorkspace();
  const me = await currentUser();
  const body = await readJson<Record<string, unknown>>(req);
  switch (kind) {
    case "folders": {
      const { name } = z.object({ name: z.string().trim().min(1).max(100) }).parse(body);
      const f = await prisma.folder.create({ data: { workspaceId: ws.id, ownerId: me.id, name } });
      return ok({ id: f.id, name: f.name, meetingIds: [], ownerId: f.ownerId }, { status: 201 });
    }
    case "playlists": {
      const { name, description } = z.object({ name: z.string().trim().min(1).max(100), description: z.string().max(500).optional() }).parse(body);
      const p = await prisma.playlist.create({ data: { workspaceId: ws.id, ownerId: me.id, name, description } });
      return ok({ id: p.id, name: p.name, description: p.description ?? undefined, ownerId: p.ownerId, clipIds: [] }, { status: 201 });
    }
    case "playlist-clips": {
      const { playlistId, highlightId } = z.object({ playlistId: z.string(), highlightId: z.string() }).parse(body);
      const count = await prisma.playlistClip.count({ where: { playlistId } });
      await prisma.playlistClip.upsert({ where: { playlistId_highlightId: { playlistId, highlightId } }, create: { playlistId, highlightId, order: count }, update: {} });
      return ok({ ok: true });
    }
    case "alerts": {
      const input = z.object({ keyword: z.string().trim().min(1).max(100), scope: z.enum(["my_calls", "team_calls"]), notify: z.enum(["email", "slack"]) }).parse(body);
      const a = await prisma.keywordAlert.create({ data: { workspaceId: ws.id, keyword: input.keyword, scope: input.scope.toUpperCase() as never, notify: input.notify.toUpperCase() as never } });
      return ok({ id: a.id, keyword: a.keyword, scope: input.scope, notify: input.notify, matchCount: 0, createdAt: a.createdAt.toISOString() }, { status: 201 });
    }
    case "highlight-types": {
      const input = z.object({ name: z.string().trim().min(1).max(40), color: z.string().regex(/^#[0-9a-f]{6}$/i) }).parse(body);
      const count = await prisma.highlightType.count({ where: { workspaceId: ws.id } });
      const key = `ht_${Date.now().toString(36)}`;
      const t = await prisma.highlightType.create({ data: { workspaceId: ws.id, key, name: input.name, color: input.color, order: count } });
      return ok({ id: t.key, name: t.name, color: t.color, builtIn: false }, { status: 201 });
    }
    default:
      return NextResponse.json({ error: `Unknown kind ${kind}` }, { status: 404 });
  }
});

export const PATCH = handler(async (req, { params }: Ctx) => {
  const { kind } = await params;
  const ws = await defaultWorkspace();
  const body = await readJson<Record<string, unknown>>(req);
  switch (kind) {
    case "folders": {
      const { id, name } = z.object({ id: z.string(), name: z.string().trim().min(1).max(100) }).parse(body);
      await prisma.folder.update({ where: { id }, data: { name } });
      return ok({ ok: true });
    }
    case "highlight-types": {
      const { id, name, color, order } = z.object({ id: z.string().optional(), name: z.string().optional(), color: z.string().optional(), order: z.array(z.string()).optional() }).parse(body);
      if (order) {
        for (const [i, key] of order.entries()) await prisma.highlightType.updateMany({ where: { workspaceId: ws.id, key }, data: { order: i } });
      } else if (id) {
        await prisma.highlightType.updateMany({ where: { workspaceId: ws.id, key: id }, data: { name, color } });
      }
      return ok({ ok: true });
    }
    default:
      return NextResponse.json({ error: `Unknown kind ${kind}` }, { status: 404 });
  }
});

export const DELETE = handler(async (req, { params }: Ctx) => {
  const { kind } = await params;
  const ws = await defaultWorkspace();
  const body = await readJson<Record<string, unknown>>(req);
  const id = String(body.id ?? "");
  switch (kind) {
    case "folders":
      await prisma.folder.deleteMany({ where: { id, workspaceId: ws.id } });
      return ok({ ok: true });
    case "playlists":
      await prisma.playlist.deleteMany({ where: { id, workspaceId: ws.id } });
      return ok({ ok: true });
    case "playlist-clips":
      await prisma.playlistClip.deleteMany({ where: { playlistId: String(body.playlistId), highlightId: String(body.highlightId) } });
      return ok({ ok: true });
    case "alerts":
      await prisma.keywordAlert.deleteMany({ where: { id, workspaceId: ws.id } });
      return ok({ ok: true });
    case "highlight-types":
      await prisma.highlightType.deleteMany({ where: { key: id, workspaceId: ws.id, builtIn: false } });
      return ok({ ok: true });
    default:
      return NextResponse.json({ error: `Unknown kind ${kind}` }, { status: 404 });
  }
});
