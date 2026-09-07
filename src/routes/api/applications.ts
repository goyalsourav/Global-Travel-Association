// Secure REST endpoint for pulling membership application data.
// Used by the Google Apps Script attached to the Google Sheet — it polls
// this endpoint every few minutes and appends any new rows.
//
// Authentication: pass APPLICATIONS_API_KEY value in the x-api-key header.
// Filtering:      pass ?since_id=N to only receive applications with id > N.
import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "@/server/db";

type AppRow = {
  id: number;
  email: string;
  name: string | null;
  data: { values: Record<string, string | string[]>; files: Record<string, unknown> };
  created_at: string;
};

export const Route = createFileRoute("/api/applications")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        // ── Auth ────────────────────────────────────────────────────────────
        const expectedKey = process.env.APPLICATIONS_API_KEY;
        if (!expectedKey) {
          return Response.json(
            { error: "APPLICATIONS_API_KEY is not configured on the server." },
            { status: 500 },
          );
        }
        const providedKey = request.headers.get("x-api-key");
        if (!providedKey || providedKey !== expectedKey) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ── Query param ──────────────────────────────────────────────────────
        const url = new URL(request.url);
        const sinceRaw = url.searchParams.get("since_id") ?? "0";
        const sinceId = parseInt(sinceRaw, 10);
        if (isNaN(sinceId) || sinceId < 0) {
          return Response.json(
            { error: "since_id must be a non-negative integer" },
            { status: 400 },
          );
        }

        // ── DB query ─────────────────────────────────────────────────────────
        const { sql, ready } = getDb();
        await ready;
        const rows = (await sql`
          SELECT id, email, name, data, created_at
          FROM membership_applications
          WHERE id > ${sinceId}
          ORDER BY id ASC
        `) as AppRow[];

        // ── Flatten for easy sheet consumption ───────────────────────────────
        const result = rows.map((row) => {
          const v = row.data.values ?? {};
          const str = (key: string): string =>
            typeof v[key] === "string" ? (v[key] as string) : "";
          const joinArr = (key: string): string =>
            Array.isArray(v[key]) ? (v[key] as string[]).join(", ") : str(key);

          const ref1 =
            [str("ref1Name"), str("ref1Phone")].filter(Boolean).join(" · ") || "—";
          const ref2 =
            [str("ref2Name"), str("ref2Phone")].filter(Boolean).join(" · ") || "—";

          const associations = joinArr("associations");
          const assocOther = str("associationOther");
          const associationsFull =
            assocOther && associations.includes("Other")
              ? associations.replace("Other", `Other: ${assocOther}`)
              : associations;

          return {
            id: row.id,
            timestamp: new Date(row.created_at).toISOString(),
            name: row.name ?? str("name"),
            email: row.email,
            contactNumber: str("contactNumber"),
            designation: str("designation"),
            socialLinks: str("socialLinks"),
            companyName: str("companyName"),
            officeAddress: str("officeAddress"),
            businessEmail: str("businessEmail"),
            establishmentYear: str("establishmentYear"),
            yearsExperience: str("yearsExperience"),
            expertise: str("expertise"),
            otherBusiness: str("otherBusiness"),
            currentAccount: str("currentAccount"),
            associations: associationsFull,
            reference1: ref1,
            reference2: ref2,
            reasonToJoin: str("reason"),
          };
        });

        return Response.json(result);
      },
    },
  },
});
