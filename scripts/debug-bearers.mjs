import postgres from "postgres";
import { readFileSync } from "fs";

const env = readFileSync(".env", "utf8");
const match = env.match(/^DATABASE_URL=(.+)$/m);
const sql = postgres(match[1].trim(), { ssl: "require", prepare: false });

try {
  const events = await sql`SELECT id, title, image_url, image_urls FROM events LIMIT 3`;
  for (const e of events) {
    console.log("event:", e.id, "image_urls type:", typeof e.image_urls, "isArray:", Array.isArray(e.image_urls), "val:", e.image_urls);
  }
} finally {
  await sql.end();
}
