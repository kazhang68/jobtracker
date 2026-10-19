import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { jobs } from "../../../db/schema";

const fields = ["company","role","location","workStyle","jobUrl","stage","stageDate","appliedDate","listedSalary","levelsSalary","level","pros","cons","notes","contact","nextStep","nextStepDate","priority"] as const;

function values(payload: Record<string, unknown>) {
  return Object.fromEntries(fields.map(key => [key, typeof payload[key] === "string" ? payload[key] : ""])) as typeof jobs.$inferInsert;
}

export async function GET() {
  try { return Response.json({ jobs: await getDb().select().from(jobs).orderBy(desc(jobs.updatedAt), desc(jobs.id)) }); }
  catch { return Response.json({ jobs: [] }); }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Record<string, unknown>;
    if (!String(payload.company || "").trim() || !String(payload.role || "").trim()) return Response.json({ error: "Company and role are required" }, { status: 400 });
    const [job] = await getDb().insert(jobs).values(values(payload)).returning();
    return Response.json({ job }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not save application" }, { status: 500 }); }
}
