import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { jobs } from "../../../../db/schema";

const fields = ["company","role","location","workStyle","jobUrl","stage","stageDate","appliedDate","listedSalary","levelsSalary","level","pros","cons","notes","contact","nextStep","nextStepDate","priority"] as const;
function values(payload: Record<string, unknown>) { return Object.fromEntries(fields.map(key => [key, typeof payload[key] === "string" ? payload[key] : ""])); }

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params; const payload = await request.json() as Record<string, unknown>;
    const [job] = await getDb().update(jobs).set({ ...values(payload), updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(jobs.id, Number(id))).returning();
    return job ? Response.json({ job }) : Response.json({ error: "Not found" }, { status: 404 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not update application" }, { status: 500 }); }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { const { id } = await context.params; await getDb().delete(jobs).where(eq(jobs.id, Number(id))); return new Response(null, { status: 204 }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not remove application" }, { status: 500 }); }
}
