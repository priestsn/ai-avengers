import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { positionsTable } from "./positions";
import { candidatesTable } from "./candidates";

export const interviewsTable = pgTable("interviews", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id").references(() => positionsTable.id, { onDelete: "cascade" }).notNull(),
  candidateId: integer("candidate_id").references(() => candidatesTable.id, { onDelete: "set null" }),
  candidateName: text("candidate_name").notNull(),
  candidateEmail: text("candidate_email").notNull(),
  preAnswers: text("pre_answers").notNull().default("{}"),
  totalScore: integer("total_score").notNull().default(0),
  skillsScore: integer("skills_score").notNull().default(0),
  speechScore: integer("speech_score").notNull().default(0),
  confidenceScore: integer("confidence_score").notNull().default(0),
  fillerWordCount: integer("filler_word_count").notNull().default(0),
  wordCount: integer("word_count").notNull().default(0),
  aiAnalysis: text("ai_analysis"),
  status: text("status").notNull().default("completed"),
  pipelineStatus: text("pipeline_status").notNull().default("completato"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInterviewSchema = createInsertSchema(interviewsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Interview = typeof interviewsTable.$inferSelect;
