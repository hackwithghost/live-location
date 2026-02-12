import { users, type User } from "@shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { storage } from "../../storage";

// Interface for auth storage operations
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: any): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    return storage.getUser(id);
  }

  async upsertUser(userData: any): Promise<User> {
    return storage.upsertUser(userData);
  }
}

export const authStorage = new AuthStorage();
