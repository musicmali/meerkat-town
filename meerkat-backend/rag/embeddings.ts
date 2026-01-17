// ============================================================================
// RAG - Embeddings Service
// ============================================================================
// Creates vector embeddings using OpenAI's text-embedding-3-small model
// ============================================================================

import OpenAI from 'openai';

// Lazy-initialized OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// Embedding model - small is cheap and good enough for most use cases
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Create embedding for a single text
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.trim(),
  });
  return response.data[0]?.embedding || [];
}

/**
 * Create embeddings for multiple texts in batch
 * More efficient than calling getEmbedding multiple times
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const openai = getOpenAI();

  // OpenAI supports up to 2048 inputs per request
  const batchSize = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize).map(t => t.trim());

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });

    const embeddings = response.data.map(d => d.embedding);
    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}

export { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS };
