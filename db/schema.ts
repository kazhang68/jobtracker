import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  company: text("company").notNull(), role: text("role").notNull(), location: text("location").notNull().default(""),
  workStyle: text("work_style").notNull().default("Remote"), jobUrl: text("job_url").notNull().default(""),
  stage: text("stage").notNull().default("Saved"), stageDate: text("stage_date").notNull(), appliedDate: text("applied_date").notNull().default(""),
  listedSalary: text("listed_salary").notNull().default(""), levelsSalary: text("levels_salary").notNull().default(""), level: text("level").notNull().default(""),
  pros: text("pros").notNull().default(""), cons: text("cons").notNull().default(""), notes: text("notes").notNull().default(""),
  contact: text("contact").notNull().default(""), nextStep: text("next_step").notNull().default(""), nextStepDate: text("next_step_date").notNull().default(""),
  priority: text("priority").notNull().default("Medium"), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`), updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
