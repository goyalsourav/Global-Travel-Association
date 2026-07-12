// Migrates the original hardcoded activities into the events table, keeping
// them at the top of the display order (sort_order 1-6). Any events that
// already exist are bumped after them. Run with: node scripts/seed-events.mjs
// Safe to re-run: skips if any of the original titles already exist.
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const match = env.match(/^DATABASE_URL=(.+)$/m);
if (!match) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}
const sql = neon(match[1].trim());

const originals = [
  {
    title: "Tathastu Kanha FAM",
    description: "A familiarisation trip through the wilderness of Kanha with partner resorts.",
    image:
      "https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Char Dham & Kailash Mansarovar",
    description: "An educational session for members on pilgrimage circuit planning.",
    image:
      "https://images.unsplash.com/photo-1585484173186-14b13c0a3d6b?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "GTA Cricket Team — TAFI Tournament",
    description: "Representing GTA on the field at the TAFI inter-association tournament.",
    image:
      "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Charity at Lions Club Vriddhashram",
    description: "Donating a water purifier to support residents at the community home.",
    image:
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Cricket Practices",
    description: "Weekly practice sessions building camaraderie among member agencies.",
    image:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "FAM at Narayani Farms & Resort",
    description: "Exploring the property, hospitality and experiences at Narayani Farms.",
    image:
      "https://images.unsplash.com/photo-1587381420270-3e1a5b9e6904?auto=format&fit=crop&w=1400&q=80",
  },
];

// Ensure the column exists even if the app hasn't started since the change.
await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0`;
await sql`UPDATE events SET sort_order = id WHERE sort_order = 0`;

const titles = originals.map((o) => o.title);
const [{ count }] = await sql`
  SELECT count(*)::int AS count FROM events WHERE title = ANY(${titles})
`;
if (count > 0) {
  console.log(`${count} of the original events already exist — skipping seed.`);
  process.exit(0);
}

// Make room at the top of the order for the six originals.
await sql`UPDATE events SET sort_order = sort_order + ${originals.length}`;
for (let i = 0; i < originals.length; i++) {
  const o = originals[i];
  await sql`
    INSERT INTO events (title, description, image_url, sort_order)
    VALUES (${o.title}, ${o.description}, ${o.image}, ${i + 1})
  `;
}
console.log(`seeded ${originals.length} original events at the top of the order.`);
