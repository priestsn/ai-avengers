import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hrUsersTable = pgTable("hr_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHrUserSchema = createInsertSchema(hrUsersTable).omit({
  id: true,
  createdAt: true,
});

export type InsertHrUser = z.infer<typeof insertHrUserSchema>;
export type HrUser = typeof hrUsersTable.$inferSelect;
