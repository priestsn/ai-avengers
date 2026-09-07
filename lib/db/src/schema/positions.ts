import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const positionsTable = pgTable("positions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  techStack: text("tech_stack").notNull(),
  questions: text("questions").notNull(),
  companyName: text("company_name"),
  companyLogoUrl: text("company_logo_url"),
  location: text("location"),
  workMode: text("work_mode"),
  employmentType: text("employment_type"),
  minRequirements: text("min_requirements"),
  educationLevel: text("education_level"),
  salaryRange: text("salary_range"),
  benefits: text("benefits"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPositionSchema = createInsertSchema(positionsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positionsTable.$inferSelect;
