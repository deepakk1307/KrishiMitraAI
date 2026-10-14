/**
 * In-Memory Vector Store for Grounded Scheme RAG
 */

import type { SchemeDocumentChunk } from './documentProcessor.ts';
import { embeddingService, EmbeddingService } from './embeddingService.ts';

export interface VectorRecord {
  chunk: SchemeDocumentChunk;
  embedding: number[];
}

export class VectorStore {
  private records: VectorRecord[] = [];
  private embeddingSvc: EmbeddingService;

  constructor(embeddingSvc: EmbeddingService = embeddingService) {
    this.embeddingSvc = embeddingSvc;
  }

  async addDocuments(chunks: SchemeDocumentChunk[]): Promise<void> {
    for (const chunk of chunks) {
      const embedding = await this.embeddingSvc.getEmbedding(chunk.text);
      this.records.push({ chunk, embedding });
    }
  }

  async similaritySearch(
    query: string,
    topK = 3,
    filter?: { state?: string; crop?: string; landSize?: number }
  ): Promise<{ chunk: SchemeDocumentChunk; score: number }[]> {
    const queryVec = await this.embeddingSvc.getEmbedding(query);

    const scored = this.records
      .filter((rec) => {
        if (!filter) return true;

        if (filter.state && filter.state.toLowerCase() !== 'all india') {
          const recState = rec.chunk.state.toLowerCase();
          if (recState !== 'all india' && recState !== filter.state.toLowerCase()) {
            return false;
          }
        }

        if (filter.crop) {
          const crops = rec.chunk.metadata.eligibleCrops.map((c) => c.toLowerCase());
          if (!crops.includes('all crops') && !crops.includes(filter.crop.toLowerCase())) {
            return false;
          }
        }

        if (filter.landSize !== undefined) {
          const { min_acres, max_acres } = rec.chunk.metadata;
          if (min_acres !== undefined && filter.landSize < min_acres) return false;
          if (max_acres !== undefined && filter.landSize > max_acres) return false;
        }

        return true;
      })
      .map((rec) => ({
        chunk: rec.chunk,
        score: this.embeddingSvc.cosineSimilarity(queryVec, rec.embedding),
      }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  clear(): void {
    this.records = [];
  }

  count(): number {
    return this.records.length;
  }
}

export const vectorStore = new VectorStore();
