import { db } from "./db";
import { locationShares, type InsertLocationShare, type LocationShare, users, type User } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  createShare(share: InsertLocationShare): Promise<LocationShare>;
  getShare(token: string): Promise<LocationShare | undefined>;
  getActiveShare(userId: string): Promise<LocationShare | undefined>;
  stopShare(userId: string): Promise<void>;
  updateShareLocation(shareId: number, lat: number, lng: number): Promise<void>;
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: any): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createShare(share: InsertLocationShare): Promise<LocationShare> {
    const [newShare] = await db.insert(locationShares).values(share).returning();
    return newShare;
  }

  async getShare(token: string): Promise<LocationShare | undefined> {
    const [share] = await db.select().from(locationShares).where(eq(locationShares.shareToken, token));
    return share;
  }

  async getActiveShare(userId: string): Promise<LocationShare | undefined> {
    const [share] = await db
      .select()
      .from(locationShares)
      .where(and(eq(locationShares.userId, userId), eq(locationShares.active, true)))
      .orderBy(desc(locationShares.createdAt))
      .limit(1);
    return share;
  }

  async stopShare(userId: string): Promise<void> {
    await db
      .update(locationShares)
      .set({ active: false })
      .where(and(eq(locationShares.userId, userId), eq(locationShares.active, true)));
  }

  async updateShareLocation(shareId: number, lat: number, lng: number): Promise<void> {
    await db
      .update(locationShares)
      .set({ lastLat: lat, lastLng: lng, lastUpdated: new Date() })
      .where(eq(locationShares.id, shareId));
  }
}

export const storage = new DatabaseStorage();
