/**
 * RAG Document Chunking & Ingestion Processor
 */

import type { GovernmentScheme } from '../../models/schemes.ts';

export interface SchemeDocumentChunk {
  id: string;
  schemeId: string;
  schemeName: string;
  category: string;
  state: string;
  text: string;
  metadata: {
    eligibleCrops: string[];
    min_acres?: number;
    max_acres?: number;
    officialSource: string;
    benefits: string[];
    documents: string[];
  };
}

export class DocumentProcessor {
  chunkScheme(scheme: GovernmentScheme): SchemeDocumentChunk[] {
    const chunks: SchemeDocumentChunk[] = [];

    const overviewText = `${scheme.name} (${scheme.hindi_name || ''}): Category: ${scheme.category}. State: ${scheme.state}. ${scheme.description}`;
    chunks.push({
      id: `${scheme.id}-overview`,
      schemeId: scheme.id,
      schemeName: scheme.name,
      category: scheme.category,
      state: scheme.state,
      text: overviewText,
      metadata: {
        eligibleCrops: scheme.eligibleCrops,
        min_acres: scheme.landRequirements.min_acres,
        max_acres: scheme.landRequirements.max_acres,
        officialSource: scheme.officialSource,
        benefits: scheme.benefits,
        documents: scheme.documents,
      },
    });

    const benefitsText = `Benefits for ${scheme.name}: ${scheme.benefits.join('; ')}. Application process: ${scheme.applicationProcess || 'Apply through official portal.'}`;
    chunks.push({
      id: `${scheme.id}-benefits`,
      schemeId: scheme.id,
      schemeName: scheme.name,
      category: scheme.category,
      state: scheme.state,
      text: benefitsText,
      metadata: {
        eligibleCrops: scheme.eligibleCrops,
        min_acres: scheme.landRequirements.min_acres,
        max_acres: scheme.landRequirements.max_acres,
        officialSource: scheme.officialSource,
        benefits: scheme.benefits,
        documents: scheme.documents,
      },
    });

    const eligibilityText = `Eligibility and Documents for ${scheme.name}: Target crops: ${scheme.eligibleCrops.join(', ')}. Eligibility conditions: ${scheme.eligibility.join('; ')}. Required documents: ${scheme.documents.join(', ')}. Official Portal: ${scheme.officialSource}`;
    chunks.push({
      id: `${scheme.id}-eligibility`,
      schemeId: scheme.id,
      schemeName: scheme.name,
      category: scheme.category,
      state: scheme.state,
      text: eligibilityText,
      metadata: {
        eligibleCrops: scheme.eligibleCrops,
        min_acres: scheme.landRequirements.min_acres,
        max_acres: scheme.landRequirements.max_acres,
        officialSource: scheme.officialSource,
        benefits: scheme.benefits,
        documents: scheme.documents,
      },
    });

    return chunks;
  }

  processAll(schemes: GovernmentScheme[]): SchemeDocumentChunk[] {
    return schemes.flatMap((s) => this.chunkScheme(s));
  }
}

export const documentProcessor = new DocumentProcessor();
