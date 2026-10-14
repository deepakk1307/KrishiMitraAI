/**
 * RAG Grounded Scheme Retriever & Context Formatter
 */

import type { FarmerProfile } from '../../models/farmer.ts';
import { VERIFIED_SCHEMES } from './schemeDataset.ts';
import { documentProcessor } from './documentProcessor.ts';
import { vectorStore, VectorStore } from './vectorStore.ts';
import { logger } from '../../utils/logger.ts';

export class SchemeRetriever {
  private store: VectorStore;
  private initialized = false;

  constructor(store: VectorStore = vectorStore) {
    this.store = store;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const chunks = documentProcessor.processAll(VERIFIED_SCHEMES);
    await this.store.addDocuments(chunks);
    this.initialized = true;
    logger.info(`✅ Initialized Scheme RAG Store with ${chunks.length} chunks.`);
  }

  async retrieveSchemes(query: string, farmer?: Partial<FarmerProfile>): Promise<{
    query: string;
    groundedContext: string;
    sources: { name: string; url: string; category: string }[];
    topSchemes: any[];
  }> {
    await this.initialize();

    const matches = await this.store.similaritySearch(query, 3, {
      state: farmer?.state,
      crop: farmer?.crop,
      landSize: farmer?.land_size,
    });

    const sources: { name: string; url: string; category: string }[] = [];
    const sourceMap = new Set<string>();

    const contextParts = matches.map((m, idx) => {
      const c = m.chunk;
      if (!sourceMap.has(c.schemeId)) {
        sourceMap.add(c.schemeId);
        sources.push({
          name: c.schemeName,
          url: c.metadata.officialSource,
          category: c.category,
        });
      }
      return `[Document ${idx + 1}: ${c.schemeName}] (Score: ${m.score.toFixed(3)})\n${c.text}\nOfficial Portal: ${c.metadata.officialSource}`;
    });

    const groundedContext =
      contextParts.length > 0
        ? contextParts.join('\n\n')
        : 'No specific matching verified government scheme found in database.';

    return {
      query,
      groundedContext,
      sources,
      topSchemes: matches.map((m) => ({
        schemeName: m.chunk.schemeName,
        category: m.chunk.category,
        state: m.chunk.state,
        score: m.score,
        officialUrl: m.chunk.metadata.officialSource,
      })),
    };
  }
}

export const schemeRetriever = new SchemeRetriever();
