/**
 * Official Google Gemini Client Interface (@google/genai)
 * Resilient multi-model cascade with automated fallback for high availability
 */

import { GoogleGenAI } from '@google/genai';
import { config } from '../../config/index.ts';
import { logger } from '../../utils/logger.ts';

export interface GeminiContentPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GeminiMessage {
  role: 'user' | 'model' | 'system';
  parts: GeminiContentPart[];
}

export interface GeminiMultimodalResult {
  text: string;
  httpStatus: number;
  httpStatusText: string;
  rawResponse: string;
  success: boolean;
  candidateExists: boolean;
  candidateTextExists: boolean;
  finishReason?: string;
  promptFeedback?: any;
  error?: string;
  errorCode?: string;
  imageFingerprint?: string;
  mimeType?: string;
  base64Length?: number;
  modelUsed?: string;
}

export class GeminiClient {
  private apiKey: string;
  private ai: GoogleGenAI | null = null;

  constructor(apiKey = config.geminiApiKey) {
    this.apiKey = apiKey;
    if (this.isLive()) {
      try {
        const key = this.getApiKey();
        this.ai = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      } catch (err) {
        logger.warn('Failed to initialize GoogleGenAI instance at constructor:', { error: String(err) });
      }
    }
  }

  isLive(): boolean {
    const key = this.apiKey || process.env.GEMINI_API_KEY || '';
    return Boolean(key && key !== 'mock' && key.trim().length > 0);
  }

  getApiKey(): string {
    return this.apiKey || process.env.GEMINI_API_KEY || '';
  }

  getAI(): GoogleGenAI {
    const key = this.getApiKey();
    if (!this.ai) {
      this.ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return this.ai;
  }

  /**
   * Returns ordered list of models to try in case of transient 503 high demand or 404
   */
  private getCandidateModels(): string[] {
    const primary = config.geminiModel || 'gemini-flash-lite-latest';
    const fallbacks = ['gemini-flash-lite-latest', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    return [...new Set([primary, ...fallbacks])];
  }

  async generateText(options: { prompt: string; systemInstruction?: string }): Promise<string> {
    if (!this.isLive()) {
      return `[Offline Mode] Advice generated for: ${options.prompt.substring(0, 80)}...`;
    }

    const ai = this.getAI();
    const models = this.getCandidateModels();
    let lastError: any = null;

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.prompt,
          config: options.systemInstruction
            ? { systemInstruction: options.systemInstruction }
            : undefined,
        });

        const text = response.text || response.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      } catch (err: any) {
        lastError = err;
        logger.warn(`Model ${model} text generation notice: ${err?.message?.slice(0, 100)}, trying next candidate...`);
      }
    }

    throw lastError || new Error('All candidate Gemini models failed to generate text');
  }

  async generateMultimodalContent(options: {
    prompt: string;
    imageBase64: string;
    jsonMode?: boolean;
    systemInstruction?: string;
  }): Promise<GeminiMultimodalResult> {
    if (!this.isLive()) {
      return {
        text: '',
        httpStatus: 503,
        httpStatusText: 'Service Unavailable',
        rawResponse: '',
        success: false,
        candidateExists: false,
        candidateTextExists: false,
        error: 'GEMINI_KEY_MISSING: Gemini Vision is unavailable because GEMINI_API_KEY is not configured.',
        errorCode: 'GEMINI_KEY_MISSING',
      };
    }

    let mimeType = 'image/jpeg';
    let rawInput = (options.imageBase64 || '').trim();
    let cleanBase64 = '';

    const match = rawInput.match(/^data:([^;]+);base64,(.+)$/s);
    if (match) {
      mimeType = match[1].trim().toLowerCase();
      cleanBase64 = match[2].trim().replace(/\s/g, '');
    } else if (rawInput.includes(',')) {
      const parts = rawInput.split(',');
      cleanBase64 = parts[1].trim().replace(/\s/g, '');
      const header = parts[0].toLowerCase();
      if (header.includes('image/png') || header.includes('png')) mimeType = 'image/png';
      else if (header.includes('image/webp') || header.includes('webp')) mimeType = 'image/webp';
      else mimeType = 'image/jpeg';
    } else {
      cleanBase64 = rawInput.replace(/\s/g, '');
      if (cleanBase64.startsWith('iVBORw0KGgo')) {
        mimeType = 'image/png';
      } else if (cleanBase64.startsWith('/9j/')) {
        mimeType = 'image/jpeg';
      } else if (cleanBase64.startsWith('UklGR')) {
        mimeType = 'image/webp';
      }
    }

    if (mimeType === 'image/jpg') {
      mimeType = 'image/jpeg';
    }

    const base64Length = cleanBase64.length;
    const imageFingerprint = `${base64Length}-${cleanBase64.slice(0, 12)}`;

    // MIME verification (only image/jpeg, image/png, image/webp allowed)
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(mimeType)) {
      return {
        text: '',
        httpStatus: 400,
        httpStatusText: 'Bad Request',
        rawResponse: '',
        success: false,
        candidateExists: false,
        candidateTextExists: false,
        error: `INVALID_MIME_TYPE: MIME type "${mimeType}" is not allowed. Only image/jpeg, image/png, image/webp permitted.`,
        errorCode: 'INVALID_MIME_TYPE',
        imageFingerprint,
        mimeType,
        base64Length,
      };
    }

    if (!cleanBase64 || base64Length < 50) {
      return {
        text: '',
        httpStatus: 400,
        httpStatusText: 'Bad Request',
        rawResponse: '',
        success: false,
        candidateExists: false,
        candidateTextExists: false,
        error: `INVALID_IMAGE_DATA: base64 payload is missing or too short (${base64Length} chars)`,
        errorCode: 'INVALID_IMAGE_DATA',
        imageFingerprint,
        mimeType,
        base64Length,
      };
    }

    const ai = this.getAI();
    const models = this.getCandidateModels();
    let lastError: any = null;

    const configObj: any = {};
    if (options.jsonMode !== false) {
      configObj.responseMimeType = 'application/json';
    }
    if (options.systemInstruction) {
      configObj.systemInstruction = options.systemInstruction;
    }

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: options.prompt,
            },
          ],
          config: configObj,
        });

        const candidates = response.candidates || [];
        const candidateExists = candidates.length > 0;
        const firstCandidate = candidates[0];
        const text = response.text || firstCandidate?.content?.parts?.[0]?.text || '';
        const candidateTextExists = Boolean(text && text.trim().length > 0);

        if (candidateTextExists) {
          return {
            text: text.trim(),
            httpStatus: 200,
            httpStatusText: 'OK',
            rawResponse: text,
            success: true,
            candidateExists: true,
            candidateTextExists: true,
            finishReason: firstCandidate?.finishReason,
            promptFeedback: response.promptFeedback,
            imageFingerprint,
            mimeType,
            base64Length,
            modelUsed: model,
          };
        }

        if (candidateExists && !candidateTextExists) {
          return {
            text: '',
            httpStatus: 200,
            httpStatusText: 'OK (No candidate text)',
            rawResponse: JSON.stringify(response),
            success: false,
            candidateExists: true,
            candidateTextExists: false,
            finishReason: firstCandidate?.finishReason,
            promptFeedback: response.promptFeedback,
            error: `GEMINI_NO_CANDIDATE: Candidate returned with finishReason ${firstCandidate?.finishReason}`,
            errorCode: 'GEMINI_NO_CANDIDATE',
            imageFingerprint,
            mimeType,
            base64Length,
            modelUsed: model,
          };
        }
      } catch (sdkError: any) {
        lastError = sdkError;
        logger.warn(`Model ${model} multimodal vision call notice: ${sdkError?.message?.slice(0, 100)}, trying next candidate...`);
      }
    }

    const errMsg = lastError?.message || 'Multimodal vision generation failed across all models';
    return {
      text: '',
      httpStatus: 500,
      httpStatusText: 'Internal Server Error',
      rawResponse: errMsg,
      success: false,
      candidateExists: false,
      candidateTextExists: false,
      error: `GEMINI_REQUEST_FAILED: ${errMsg}`,
      errorCode: 'GEMINI_REQUEST_FAILED',
      imageFingerprint,
      mimeType,
      base64Length,
    };
  }

  async embedText(text: string): Promise<number[]> {
    if (!this.isLive()) {
      return [];
    }

    try {
      const ai = this.getAI();
      const model = config.geminiEmbeddingModel || 'gemini-embedding-2-preview';
      const res: any = await ai.models.embedContent({
        model,
        contents: text,
      });

      if (res.embeddings?.[0]?.values) {
        return res.embeddings[0].values;
      }
      if (res.embedding?.values) {
        return res.embedding.values;
      }
      return [];
    } catch (e: any) {
      logger.warn(`Gemini embedding notice (${e?.message?.slice(0, 80)})`);
      return [];
    }
  }
}

export const geminiClient = new GeminiClient();
