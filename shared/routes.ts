import { z } from 'zod';
import { locationShares, users } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    // Basic auth check endpoint
    status: {
      method: 'GET' as const,
      path: '/api/auth/status' as const,
      responses: {
        200: z.object({
          isAuthenticated: z.boolean(),
          user: z.custom<typeof users.$inferSelect>().optional(),
        }),
      },
    },
  },
  shares: {
    create: {
      method: 'POST' as const,
      path: '/api/shares' as const,
      input: z.object({}), // No input needed, we generate token server-side
      responses: {
        201: z.custom<typeof locationShares.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    stop: {
      method: 'POST' as const,
      path: '/api/shares/stop' as const,
      input: z.object({}),
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/shares/:token' as const,
      responses: {
        200: z.custom<typeof locationShares.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    // Get active share for current user
    me: {
      method: 'GET' as const,
      path: '/api/shares/me/active' as const,
      responses: {
        200: z.custom<typeof locationShares.$inferSelect>().nullable(), // Null if no active share
        401: errorSchemas.unauthorized,
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
