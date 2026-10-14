/**
 * Global Configuration for KrishiMitra AI Backend
 */

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || process.env.AUTH_SECRET || 'krishimitra_production_jwt_secret_key_2026_secure_agro_ai',
  tokenExpiryHours: 24 * 7,
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
  geminiEmbeddingModel: 'gemini-embedding-2-preview',
  mandiApiKey: process.env.MANDI_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || 'memory',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
