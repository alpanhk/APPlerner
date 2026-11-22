import { boolean, integer, jsonb, pgTable, serial, timestamp, uniqueIndex, uuid, varchar, text, index } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 24 }).notNull(),
  avatar: varchar("avatar", { length: 16 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const progress = pgTable(
  "chapter_progress",
  {
    id: serial("id").primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    chapterId: varchar("chapter_id", { length: 16 }).notNull(),
    status: varchar("status", { length: 12 }).notNull().default("aktif"),
    state: jsonb("state"),
    notes: jsonb("notes").$type<string[]>().notNull().default([]),
    completedAt: timestamp("completed_at"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("progress_profile_chapter").on(t.profileId, t.chapterId)],
);

export const attempts = pgTable(
  "attempts",
  {
    id: serial("id").primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    chapterId: varchar("chapter_id", { length: 16 }).notNull(),
    objective: varchar("objective", { length: 32 }).notNull(),
    who: varchar("who", { length: 32 }).notNull(),
    text: text("text").notNull(),
    hintsUsed: integer("hints_used").notNull().default(0),
    full: boolean("full").notNull().default(false),
    guided: boolean("guided").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("attempts_profile").on(t.profileId)],
);
