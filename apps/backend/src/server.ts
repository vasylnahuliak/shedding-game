import * as Sentry from '@sentry/node';
import { createAdapter } from '@socket.io/redis-adapter';
import type { CorsOptions } from 'cors';
import cors from 'cors';
import express from 'express';
import http from 'http';
import type { DefaultEventsMap } from 'socket.io';
import { Server } from 'socket.io';

import { ensureDatabaseConnection } from '@/db/client';
import { loadBackendEnvFiles } from '@/env';
import { handleApiError } from '@/middleware/errorHandler';
import { resolveRequestLocale } from '@/middleware/locale';
import { apiRateLimit } from '@/middleware/rateLimit';
import { attachRequestContext } from '@/middleware/requestContext';
import accountDeletionRequestRoutes from '@/routes/accountDeletionRequests';
import adminRoutes from '@/routes/admin';
import authRoutes from '@/routes/auth';
import roomRoutes from '@/routes/rooms';
import statsRoutes from '@/routes/stats';
import { stopGameJobWorker } from '@/services/jobRunner';
import {
  getRedisAdapterClients,
  getRedisKeyPrefix,
  initRedisInfra,
  isRedisEnabled,
  shutdownRedisInfra,
} from '@/services/redis';
import { captureBackendException, flushBackendTelemetry } from '@/services/sentry';
import type { AppSocketServer, SocketData } from '@/services/socket';
import { initSocket } from '@/services/socket';
import { toPositiveInt } from '@/utils/numbers';

loadBackendEnvFiles();

const parseCsv = (rawValue: string | undefined): string[] => {
  if (!rawValue) return [];

  return rawValue
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = parseCsv(process.env.CORS_ALLOWED_ORIGINS);
const trustProxyHops = toPositiveInt(process.env.TRUST_PROXY_HOPS, 1);

const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true;
  if (allowedOrigins.length === 0) return !isProduction;
  return allowedOrigins.includes(origin);
};

const resolveCorsOrigin: CorsOptions['origin'] = (origin, callback) => {
  callback(null, isOriginAllowed(origin));
};

const resolveSocketCorsOrigin = (
  origin: string | undefined,
  callback: (error: Error | null, success?: boolean) => void
): void => {
  callback(null, isOriginAllowed(origin));
};

const app = express();
if (isProduction || process.env.TRUST_PROXY_HOPS) {
  app.set('trust proxy', trustProxyHops);
}

app.disable('x-powered-by');
app.use(
  cors({
    origin: resolveCorsOrigin,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);
app.use(attachRequestContext);
app.use(express.json({ limit: '1kb' }));
app.use(apiRateLimit);
app.use(resolveRequestLocale);

let isReady = false;

app.get('/health', (_req, res) => {
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ok' : 'starting',
  });
});

app.use('/admin', adminRoutes);
app.use('/account-deletion-requests', accountDeletionRequestRoutes);
app.use('/auth', authRoutes);
app.use('/rooms', roomRoutes);
app.use('/stats', statsRoutes);
if (Sentry.isInitialized()) {
  Sentry.setupExpressErrorHandler(app);
}
app.use(handleApiError);

const server = http.createServer(app);
const io: AppSocketServer = new Server<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>(server, {
  cors: {
    origin: resolveSocketCorsOrigin,
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;
let shutdownInProgress = false;

const shutdown = (signal: NodeJS.Signals) => {
  if (shutdownInProgress) return;
  shutdownInProgress = true;
  isReady = false;

  console.log(`${signal} received. Shutting down backend...`);

  const forceExitTimer = setTimeout(() => {
    console.error('Force shutdown timeout reached.');
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  server.close((serverError) => {
    void (async () => {
      stopGameJobWorker();
      let shouldFlushSentry = false;

      if (serverError) {
        console.error('Failed to close HTTP server:', serverError);
        captureBackendException(serverError, {
          tags: { phase: 'shutdown', target: 'http_server' },
        });
        shouldFlushSentry = true;
      }

      try {
        await shutdownRedisInfra();
      } catch (redisError) {
        console.error('Failed to close Redis clients:', redisError);
        captureBackendException(redisError, {
          tags: { phase: 'shutdown', target: 'redis' },
        });
        shouldFlushSentry = true;
      } finally {
        if (shouldFlushSentry) {
          await flushBackendTelemetry();
        }
        clearTimeout(forceExitTimer);
        process.exit(serverError ? 1 : 0);
      }
    })();
  });
};

process.on('SIGINT', () => {
  shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

const bootstrap = async () => {
  if (isProduction && allowedOrigins.length === 0) {
    console.warn(
      'CORS_ALLOWED_ORIGINS is not set. Browser clients will be blocked by CORS in production.'
    );
  }

  await ensureDatabaseConnection();
  await initRedisInfra();

  if (isRedisEnabled()) {
    const adapterClients = getRedisAdapterClients();
    if (!adapterClients) {
      throw new Error('Redis adapter clients are not initialized.');
    }
    io.adapter(
      createAdapter(adapterClients.pub, adapterClients.sub, {
        key: `${getRedisKeyPrefix()}:socket.io`,
      })
    );
  }

  if (
    !process.env.SUPABASE_JWT_ISSUER &&
    !process.env.SUPABASE_URL &&
    !process.env.EXPO_PUBLIC_SUPABASE_URL
  ) {
    console.warn(
      'Supabase JWT verification is not configured: set SUPABASE_URL or SUPABASE_JWT_ISSUER.'
    );
  }
  if (!process.env.SUPABASE_SECRET_KEY) {
    console.warn(
      'SUPABASE_SECRET_KEY is not set. Account deletion will fail until a server-side Supabase secret key is configured.'
    );
  }
  initSocket(io);
  isReady = true;

  server.listen(PORT, () => {
    console.log(`Server running on port ${String(PORT)}`);
  });
};

bootstrap().catch(async (error: unknown) => {
  isReady = false;
  console.error('Failed to start backend:', error);
  captureBackendException(error, {
    tags: { phase: 'bootstrap' },
  });
  stopGameJobWorker();
  try {
    await shutdownRedisInfra();
  } catch (redisError) {
    console.error('Failed to close Redis clients:', redisError);
    captureBackendException(redisError, {
      tags: { phase: 'bootstrap_shutdown', target: 'redis' },
    });
  }
  await flushBackendTelemetry();
  process.exit(1);
});
