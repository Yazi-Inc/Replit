import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  totalSpent: integer("total_spent").default(0).notNull(),
  videosWatched: integer("videos_watched").default(0).notNull(),
});

export const videos = pgTable("videos", {
  id: varchar("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // in minutes
  price: integer("price").notNull(), // in pesewas
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url").notNull(),
  level: text("level").notNull(), // 'beginner', 'intermediate', 'advanced'
  subject: text("subject").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  videoId: varchar("video_id").references(() => videos.id).notNull(),
  amount: integer("amount").notNull(), // in pesewas
  currency: text("currency").default("GHS").notNull(),
  paystackReference: text("paystack_reference").notNull().unique(),
  status: text("status").notNull(), // 'pending', 'successful', 'failed'
  accessExpiresAt: timestamp("access_expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  verifiedAt: timestamp("verified_at"),
});

export const videoAccess = pgTable("video_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  videoId: varchar("video_id").references(() => videos.id).notNull(),
  paymentId: varchar("payment_id").references(() => payments.id).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  totalSpent: true,
  videosWatched: true,
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
});

export const insertVideoAccessSchema = createInsertSchema(videoAccess).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type VideoAccess = typeof videoAccess.$inferSelect;
export type InsertVideoAccess = z.infer<typeof insertVideoAccessSchema>;
