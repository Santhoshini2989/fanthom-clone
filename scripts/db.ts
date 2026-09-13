/**
 * Local PostgreSQL without an admin install.
 *
 *   npm run db:start   boots an embedded PostgreSQL server (data in .pgdata/)
 *                      on the host/port/user/db from DATABASE_URL and keeps it
 *                      running until Ctrl+C.
 *   npm run db:stop    stops a server started in the background.
 *
 * If you already run PostgreSQL yourself (native install, Docker), just point
 * DATABASE_URL at it and skip these scripts.
 */
import EmbeddedPostgres from "embedded-postgres";
import path from "node:path";
import fs from "node:fs";

const url = new URL(process.env.DATABASE_URL ?? "postgresql://fathom:fathom@127.0.0.1:5433/fathom");
const dataDir = path.resolve(process.cwd(), ".pgdata");
const user = decodeURIComponent(url.username || "fathom");
const password = decodeURIComponent(url.password || "fathom");
const port = Number(url.port || 5432);
const database = url.pathname.replace(/^\//, "") || "fathom";

async function main() {
  const cmd = process.argv[2] ?? "start";
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user,
    password,
    port,
    persistent: true,
    onLog: (m) => process.stdout.write(String(m)),
    onError: (m) => process.stderr.write(String(m)),
  });

  if (cmd === "stop") {
    await pg.stop().catch(() => {});
    console.log("[db] stopped");
    return;
  }

  const fresh = !fs.existsSync(path.join(dataDir, "PG_VERSION"));
  if (fresh) {
    console.log(`[db] initialising cluster in ${dataDir} (first run, downloads PostgreSQL binaries once)`);
    await pg.initialise();
  }
  console.log(`[db] starting PostgreSQL on 127.0.0.1:${port} (user ${user}, db ${database})`);
  await pg.start();
  if (fresh) {
    await pg.createDatabase(database).catch(() => {});
    console.log(`[db] created database "${database}"`);
  }
  console.log("[db] ready. Leave this running; Ctrl+C to stop.");
  const stop = async () => {
    console.log("\n[db] stopping…");
    await pg.stop().catch(() => {});
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  // keep alive
  await new Promise(() => {});
}

main().catch((e) => {
  console.error("[db] failed:", e?.message ?? e);
  process.exit(1);
});
