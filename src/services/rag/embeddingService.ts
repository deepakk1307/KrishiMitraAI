/**
 * Vector Embedding & Similarity Service
 */

import { geminiClient } from '../ai/geminiClient.ts';
import { logger } from '../../utils/logger.ts';
import { config } from '../../config/index.ts';

export class EmbeddingService {
  async getEmbedding(text: string): Promise<number[]> {
    try {
      if (config.geminiApiKey && config.geminiApiKey !== 'mock') {
        const vec = await geminiClient.embedText(text);
        if (vec && vec.length > 0) return vec;
      }
    } catch (e: any) {
      logger.warn(`Gemini text-embedding-004 fallback: ${e.message}`);
    }

    return this.generateSemanticFallbackVector(text);
  }

  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private generateSemanticFallbackVector(text: string): number[] {
    const vocab = [
      'kisan', 'farmer', 'pm-kisan', 'insurance', 'fasal', 'bima', 'pmfby', 'credit',
      'kcc', 'loan', 'subsidy', 'drip', 'irrigation', 'pmksy', 'organic', 'pkvy',
      'mechanization', 'tractor', 'smam', 'wheat', 'paddy', 'mustard', 'soybean', 'cotton',
      'acres', 'hectare', 'money', 'benefit', 'scheme', 'yojana', 'dbt', 'aadhaar',
      'eligibility', 'documents', 'uttar pradesh', 'punjab', 'madhya pradesh', 'all india',
      'loss', 'compensation', 'drought', 'flood', 'rain', 'weather', 'fertilizer', 'pesticide',
      'solar', 'pump', 'tubewell', 'karj', 'rahat', 'waiver', 'bank', 'application',
      'crop', 'yield', 'harvest', 'pest', 'disease', 'seed', 'soil', 'mandate',
    ];

    const clean = text.toLowerCase();
    const vec: number[] = new Array(vocab.length).fill(0.01);

    vocab.forEach((word, idx) => {
      if (clean.includes(word)) {
        vec[idx] += 1.0;
      }
    });

    let norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    return norm > 0 ? vec.map((v) => v / norm) : vec;
  }
}

export const embeddingService = new EmbeddingService();
