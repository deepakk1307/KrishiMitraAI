/**
 * KrishiMitra AI - Production Server Entry Point
 * Full-Stack Node.js + TypeScript Native Server for Indian Farmers
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSecurityHeaders } from './src/middleware/security.ts';
import { errorHandler } from './src/middleware/errorHandler.ts';
import type { AuthenticatedRequest } from './src/middleware/auth.ts';
import { dispatchApiRoute } from './src/routes/index.ts';
import { schemeRetriever } from './src/services/rag/schemeRetriever.ts';
import { initDatabase } from './src/database/dbConnection.ts';
import { logger } from './src/utils/logger.ts';
import { config } from './src/config/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, 'public');

export async function createServer(): Promise<http.Server> {
  await initDatabase();

  schemeRetriever.initialize().catch((err) => {
    logger.warn('Scheme RAG initialization notice:', { error: String(err) });
  });

  const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const method = req.method?.toUpperCase() || 'GET';

    if (method === 'OPTIONS') {
      res.writeHead(204, getSecurityHeaders());
      res.end();
      return;
    }

    if (pathname.startsWith('/api/')) {
      try {
        const body = await parseJsonBody(req);
        const queryParams: Record<string, string> = {};
        parsedUrl.searchParams.forEach((val, key) => {
          queryParams[key] = val;
        });

        const authReq: AuthenticatedRequest = {
          headers: req.headers,
          body,
          query: queryParams,
          params: {},
        };

        const result = await dispatchApiRoute(pathname, method, authReq);

        res.writeHead(200, getSecurityHeaders());
        res.end(JSON.stringify(result));
      } catch (err) {
        const errorResult = errorHandler(err);
        res.writeHead(errorResult.statusCode, getSecurityHeaders());
        res.end(JSON.stringify(errorResult.body));
      }
      return;
    }

    serveStaticFile(pathname, res);
  });

  return server;
}

function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 15 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

function serveStaticFile(reqPath: string, res: http.ServerResponse): void {
  let safePath = reqPath === '/' ? '/index.html' : reqPath;
  if (!path.extname(safePath)) {
    safePath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR) || !fs.existsSync(PUBLIC_DIR)) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'KrishiMitra AI Backend API Server is running.',
      endpoints: '/api/health',
      assistant: '/api/assistant',
      weather: '/api/weather/current',
      mandi: '/api/mandi/prices',
      schemes: '/api/schemes/search',
    }));
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexPath, (indexErr, indexData) => {
        if (indexErr) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'KrishiMitra AI Backend API Server is running.', endpoints: '/api/health' }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(indexData);
      });
      return;
    }

    const mimeTypes: Record<string, string> = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
    };

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
}

// Automatically start server when executed
createServer().then((server) => {
  server.listen(config.port, '0.0.0.0', () => {
    logger.info(`🌾 KrishiMitra AI backend listening on port ${config.port} (0.0.0.0)`);
    logger.info(`🤖 AI Assistant Endpoint: http://0.0.0.0:${config.port}/api/assistant`);
    logger.info(`🏥 Health Check Endpoint: http://0.0.0.0:${config.port}/api/health`);
  });
}).catch((err) => {
  logger.error('Fatal startup error:', err);
  process.exit(1);
});
