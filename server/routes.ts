import type { Express } from "express";
import type { Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { WS_EVENTS } from "@shared/schema";
import { nanoid } from "nanoid";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // --- API Routes ---

  app.get(api.auth.status.path, async (req, res) => {
    if (req.isAuthenticated()) {
      const claims = (req.user as any).claims;
      const user = await storage.getUser(claims.sub);
      return res.json({ isAuthenticated: true, user: user || claims });
    }
    res.json({ isAuthenticated: false });
  });

  app.post(api.shares.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const userId = (req.user as any).claims.sub;
    
    // Stop any existing active share
    await storage.stopShare(userId);

    const token = nanoid(12);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 

    const share = await storage.createShare({
      userId: userId,
      shareToken: token,
      active: true,
      expiresAt: expiresAt,
    });

    res.status(201).json(share);
  });

  app.post(api.shares.stop.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    const userId = (req.user as any).claims.sub;
    await storage.stopShare(userId);
    res.json({ message: "Sharing stopped" });
  });

  app.get(api.shares.me.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const userId = (req.user as any).claims.sub;
    const share = await storage.getActiveShare(userId);
    res.json(share || null);
  });

  app.get(api.shares.get.path, async (req, res) => {
    const { token } = req.params;
    const share = await storage.getShare(token);
    if (!share || !share.active) {
       return res.status(404).json({ message: "Share link not found or expired" });
    }
    
    if (share.expiresAt && new Date() > share.expiresAt) {
       return res.status(404).json({ message: "Share link expired" });
    }

    res.json(share);
  });

  // --- WebSocket Setup ---
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  const subscriptions = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws) => {
    let subscribedToken: string | null = null;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === WS_EVENTS.SUBSCRIBE) {
          const token = data.payload.token;
          if (!token) return;
          
          if (!subscriptions.has(token)) {
            subscriptions.set(token, new Set());
          }
          subscriptions.get(token)!.add(ws);
          subscribedToken = token;
        } else if (data.type === WS_EVENTS.LOCATION_UPDATE) {
          const { token, lat, lng } = data.payload;
          if (!token) return;

          const share = await storage.getShare(token);
          if (share && share.active) {
              await storage.updateShareLocation(share.id, lat, lng);
              
              if (subscriptions.has(token)) {
                 const viewers = subscriptions.get(token)!;
                 const msg = JSON.stringify({
                     type: WS_EVENTS.LOCATION_UPDATE,
                     payload: { lat, lng }
                 });
                 viewers.forEach(viewer => {
                     if (viewer.readyState === WebSocket.OPEN) {
                         viewer.send(msg);
                     }
                 });
              }
          }
        }
      } catch (e) {
        console.error("WS Message error", e);
      }
    });

    ws.on('close', () => {
      if (subscribedToken && subscriptions.has(subscribedToken)) {
        subscriptions.get(subscribedToken)!.delete(ws);
      }
    });
  });

  return httpServer;
}
