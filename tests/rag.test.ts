/**
 * Government Scheme RAG Pipeline Test Suite
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { documentProcessor } from '../src/services/rag/documentProcessor.ts';
import { embeddingService } from '../src/services/rag/embeddingService.ts';
import { schemeRetriever } from '../src/services/rag/schemeRetriever.ts';
import { VERIFIED_SCHEMES } from '../src/services/rag/schemeDataset.ts';
import { db } from '../src/database/inMemoryDb.ts';

describe('Government Scheme RAG Pipeline Test Suite', () => {
  it('should process verified schemes into rich semantic chunks with official URLs', () => {
    const chunks = documentProcessor.processAll(VERIFIED_SCHEMES);
    assert.ok(chunks.length >= VERIFIED_SCHEMES.length * 3);

    const pmKisanChunk = chunks.find((c) => c.schemeId === 'pm-kisan');
    assert.ok(pmKisanChunk);
    assert.equal(pmKisanChunk?.metadata.officialSource, 'https://pmkisan.gov.in');
  });

  it('should generate embeddings and compute accurate cosine similarity', async () => {
    const vecA = await embeddingService.getEmbedding('pm kisan subsidy bank dbt transfer');
    const vecB = await embeddingService.getEmbedding('pmkisan 6000 rupees installment');
    const vecC = await embeddingService.getEmbedding('tractor implements heavy diesel');

    const simAB = embeddingService.cosineSimilarity(vecA, vecB);
    const simAC = embeddingService.cosineSimilarity(vecA, vecC);

    assert.ok(simAB > simAC, 'Semantically related queries must have higher cosine similarity');
  });

  it('should retrieve relevant schemes and grounded passages for farmer queries', async () => {
    const farmer = await db.farmer.getDefaultProfile();
    const result = await schemeRetriever.retrieveSchemes('crop loss hail storm unseasonal rain insurance', farmer);

    assert.ok(result.topSchemes.length > 0);
    assert.ok(result.groundedContext.includes('PMFBY') || result.groundedContext.includes('Insurance') || result.groundedContext.includes('Bima'));
    assert.ok(result.sources.some((s) => s.url.includes('pmfby.gov.in')));
  });
});
