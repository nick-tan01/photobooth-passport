// Phase 1 backend verification against the LIVE Supabase project. Requires
// a local dev server (`npm run dev`, default http://localhost:3000) and
// .env.local populated with NEXT_PUBLIC_SUPABASE_URL /
// NEXT_PUBLIC_SUPABASE_ANON_KEY.
//
// This script only ever uses the anon key (no service role key exists in
// this project, by design — see CLAUDE.md). Two of the required checks
// (flipping is_public, deleting the test row) need privileged access that
// only an operator with Supabase MCP `execute_sql` access can perform, so
// this is a two-phase, human/agent-in-the-loop script:
//
//   1. node scripts/verify-phase1.mjs setup
//        -> creates a test strip via POST /api/strips, confirms it's
//           visible to an anon client and that GET /s/<slug> is a 200
//           containing the booth name, then prints the exact SQL to run.
//   2. (privileged) run the printed `update strips set is_public = false…`
//   3. node scripts/verify-phase1.mjs verify-private <slug> <row-id>
//        -> confirms the anon client can no longer see the row, that
//           GET /s/<slug> now 404s, and that charter codes are never
//           anonymously readable — then prints cleanup SQL.
//   4. (privileged) run the printed `delete from strips…` / storage cleanup
//
// Usage:
//   node scripts/verify-phase1.mjs setup
//   node scripts/verify-phase1.mjs verify-private <slug> <row-id>

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const path = fileURLToPath(new URL("../.env.local", import.meta.url));
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnvLocal();

const SITE = process.env.VERIFY_SITE_URL || "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
  );
  process.exit(1);
}

function anonClient() {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
  });
}

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
}

// 1x1 black JPEG — valid magic bytes (FF D8 FF ...) so the route's mime
// sniff accepts it.
function tinyJpeg() {
  return Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
    "base64",
  );
}

async function setup() {
  console.log(`[setup] POST ${SITE}/api/strips`);
  const form = new FormData();
  form.set("image", new Blob([tinyJpeg()], { type: "image/jpeg" }), "test.jpg");
  form.set("booth_id", "standard");
  form.set("caption", "verify-phase1 test strip");
  form.set("date_text", "1 JAN 2026");
  form.set("serial", "VERIFY-0001");
  form.set("finish", "gloss");

  const res = await fetch(`${SITE}/api/strips`, { method: "POST", body: form });
  const body = await res.json().catch(() => ({}));
  assert(res.status === 200, `POST /api/strips expected 200, got ${res.status}: ${JSON.stringify(body)}`);
  assert(
    typeof body.slug === "string" && body.slug.length === 8,
    `expected an 8-char slug, got ${JSON.stringify(body)}`,
  );
  console.log(`[setup] OK — slug=${body.slug} url=${body.url}`);

  const supabase = anonClient();
  const { data, error } = await supabase
    .from("strips")
    .select("id, booth_id, share_slug, is_public")
    .eq("share_slug", body.slug)
    .maybeSingle();
  assert(!error, `anon select failed: ${error?.message}`);
  assert(data, "strip row not visible to anon client while is_public=true");
  console.log(`[setup] OK — anon SELECT sees row id=${data.id} is_public=${data.is_public}`);

  const pageRes = await fetch(`${SITE}/s/${body.slug}`);
  const pageText = await pageRes.text();
  assert(pageRes.status === 200, `GET /s/${body.slug} expected 200, got ${pageRes.status}`);
  assert(pageText.includes("The Standard"), "share page missing booth name 'The Standard'");
  console.log(`[setup] OK — GET /s/${body.slug} is 200 and contains the booth name`);

  console.log("");
  console.log("NEXT STEP (privileged — run via Supabase MCP execute_sql):");
  console.log(`  update strips set is_public = false where id = '${data.id}';`);
  console.log("");
  console.log(`THEN RUN: node scripts/verify-phase1.mjs verify-private ${body.slug} ${data.id}`);
}

async function verifyPrivate(slug, id) {
  const supabase = anonClient();

  const { data, error } = await supabase
    .from("strips")
    .select("id")
    .eq("share_slug", slug)
    .maybeSingle();
  assert(!error, `anon select errored (should just return no rows, not error): ${error?.message}`);
  assert(
    !data,
    `expected anon SELECT to see nothing after is_public=false, but got a row: ${JSON.stringify(data)}`,
  );
  console.log("[verify-private] OK — anon client cannot see the row once is_public=false");

  const pageRes = await fetch(`${SITE}/s/${slug}`);
  assert(pageRes.status === 404, `expected GET /s/${slug} to 404 once private, got ${pageRes.status}`);
  console.log(`[verify-private] OK — GET /s/${slug} now 404s`);

  const { data: charterRows, error: charterError } = await supabase
    .from("charters")
    .select("code");
  assert(!charterError, `charters select unexpectedly errored: ${charterError?.message}`);
  assert(
    Array.isArray(charterRows) && charterRows.length === 0,
    `expected anon SELECT on charters to return zero rows (RLS denies read), got ${JSON.stringify(charterRows)}`,
  );
  console.log("[verify-private] OK — anon client cannot read any charter codes (0 rows returned)");

  console.log("");
  console.log("NEXT STEP (privileged cleanup — run via Supabase MCP execute_sql):");
  console.log(`  delete from strips where id = '${id}';`);
  console.log(`  delete from storage.objects where bucket_id = 'strips-public' and name like '${slug}%';`);
}

const [, , cmd, ...args] = process.argv;
if (cmd === "setup") {
  await setup();
} else if (cmd === "verify-private") {
  const [slug, id] = args;
  if (!slug || !id) {
    console.error("usage: verify-phase1.mjs verify-private <slug> <row-id>");
    process.exit(1);
  }
  await verifyPrivate(slug, id);
} else {
  console.error("usage: node scripts/verify-phase1.mjs <setup|verify-private [slug] [row-id]>");
  process.exit(1);
}
