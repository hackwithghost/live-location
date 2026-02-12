import { pgTable, text, serial, boolean, timestamp, doublePrecision, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Consolidated User table for Replit Auth and app
export const users = pgTable("users", {
  id: varchar("id").primaryKey(), // Replit Auth 'sub' claim
  email: varchar("email").unique(),
  username: text("username"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const locationShares = pgTable("location_shares", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  shareToken: text("share_token").notNull().unique(),
  active: boolean("active").default(true).notNull(),
  lastLat: doublePrecision("last_lat"),
  lastLng: doublePrecision("last_lng"),
  lastUpdated: timestamp("last_updated"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  shares: many(locationShares),
}));

export const sharesRelations = relations(locationShares, ({ one }) => ({
  user: one(users, {
    fields: [locationShares.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  username: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertShareSchema = createInsertSchema(locationShares).pick({
  userId: true,
  shareToken: true,
  active: true,
  expiresAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LocationShare = typeof locationShares.$inferSelect;
export type InsertLocationShare = z.infer<typeof insertShareSchema>;

// WebSocket Message Types
export const WS_EVENTS = {
  LOCATION_UPDATE: 'location_update',
  SUBSCRIBE: 'subscribe',
  VIEWER_COUNT: 'viewer_count',
  SHARE_ENDED: 'share_ended'
} as const;

export interface LocationUpdatePayload {
  lat: number;
  lng: number;
}
