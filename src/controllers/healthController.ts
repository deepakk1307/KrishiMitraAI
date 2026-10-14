/**
 * Diagnostics Health Controller
 */

import { geminiClient } from '../services/ai/geminiClient.ts';
import { config } from '../config/index.ts';

export async function handleHealthCheck(): Promise<any> {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'KrishiMitra AI Core Orchestrator',
    version: '1.0.0',
    capabilities: {
      geminiConfigured: geminiClient.isLive(),
      mandiApiConfigured: Boolean(config.mandiApiKey),
      databaseAdapter: config.databaseUrl.startsWith('postgres') ? 'PostgreSQL' : 'InMemory',
    },
  };
}
