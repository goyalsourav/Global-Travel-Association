import postgres from "postgres";
import { readFileSync } from "fs";

const env = readFileSync(".env", "utf8");
const match = env.match(/^DATABASE_URL=(.+)$/m);
const sql = postgres(match[1].trim(), { ssl: "require", prepare: false });

try {
  const rows = await sql`SELECT key, value FROM site_content`;
  for (const r of rows) {
    let parsed = r.value;
    while (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        break;
      }
    }
    console.log(`Fixing ${r.key}:`, typeof parsed, Array.isArray(parsed) ? "array" : "object");
    await sql`
      UPDATE site_content
      SET value = ${JSON.stringify(parsed)}::jsonb
      WHERE key = ${r.key}
    `;
  }
  console.log("✓ site_content values parsed and saved as real JSONB!");
} finally {
  await sql.end();
}
