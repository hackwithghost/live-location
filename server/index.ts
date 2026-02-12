import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

/* ===============================
   Extend IncomingMessage
================================ */
declare module "http" {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
}

/* ===============================
   Middleware
================================ */
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));

/* ===============================
   Logger
================================ */
export function log(message: string, source = "server") {
  const time = new Date().toISOString();
  console.log(`${time} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJson: any;

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    capturedJson = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;

    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} ${duration}ms`;
      if (capturedJson) {
        logLine += ` :: ${JSON.stringify(capturedJson)}`;
      }
      log(logLine, "api");
    }
  });

  next();
});

/* ===============================
   Bootstrap Server
================================ */
async function startServer() {
  try {
    await registerRoutes(httpServer, app);

    // Global error handler
    app.use(
      (err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";

        console.error("❌ Server Error:", err);

        if (!res.headersSent) {
          res.status(status).json({ message });
        }
      }
    );

    // Production → Serve static build
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      // Development → Setup Vite
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    // 🚀 CRITICAL FOR RAILWAY
    const PORT = Number(process.env.PORT) || 5000;

    httpServer.listen(PORT, "0.0.0.0", () => {
      log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
