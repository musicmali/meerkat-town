// ============================================================================
// RAG - Pinecone Vector Store
// ============================================================================
// Manages vector storage and retrieval using Pinecone
// ============================================================================

import { Pinecone } from '@pinecone-database/pinecone';
import { EMBEDDING_DIMENSIONS } from './embeddings';

// Index name for Meerkat knowledge base
const INDEX_NAME = 'meerkat-knowledge';

// Pinecone client (lazy initialized)
let pineconeClient: Pinecone | null = null;

/**
 * Get or create the Pinecone client
 */
function getPinecone(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY not set');
    }
    pineconeClient = new Pinecone({ apiKey });
  }
  return pineconeClient;
}

/**
 * Initialize the Pinecone index (creates if doesn't exist)
 */
export async function initializeIndex(): Promise<void> {
  const pinecone = getPinecone();

  // Check if index exists
  const indexes = await pinecone.listIndexes();
  const indexExists = indexes.indexes?.some(idx => idx.name === INDEX_NAME);

  if (!indexExists) {
    console.log(`[Pinecone] Creating index: ${INDEX_NAME}`);
    await pinecone.createIndex({
      name: INDEX_NAME,
      dimension: EMBEDDING_DIMENSIONS,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      },
    });

    // Wait for index to be ready
    console.log('[Pinecone] Waiting for index to be ready...');
    await new Promise(resolve => setTimeout(resolve, 60000)); // 60 seconds
  }

  console.log(`[Pinecone] Index ${INDEX_NAME} ready`);
}

/**
 * Get the Pinecone index
 */
export function getIndex() {
  const pinecone = getPinecone();
  return pinecone.index(INDEX_NAME);
}

/**
 * Document chunk with metadata
 */
export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    title: string;
    category?: string;
    agentId?: number; // For per-agent knowledge
  };
}

/**
 * Upsert vectors to Pinecone
 */
export async function upsertVectors(
  chunks: DocumentChunk[],
  embeddings: number[][]
): Promise<void> {
  const index = getIndex();

  // Prepare vectors for upsert
  const vectors = chunks.map((chunk, i) => ({
    id: chunk.id,
    values: embeddings[i],
    metadata: {
      content: chunk.content,
      source: chunk.metadata.source,
      title: chunk.metadata.title,
      category: chunk.metadata.category || '',
      agentId: chunk.metadata.agentId || 0,
    },
  }));

  // Upsert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.upsert(batch);
    console.log(`[Pinecone] Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);
  }
}

/**
 * Query similar vectors
 */
export async function querySimilar(
  embedding: number[],
  topK: number = 5,
  filter?: Record<string, any>
): Promise<Array<{ id: string; score: number; content: string; metadata: any }>> {
  const index = getIndex();

  const queryResponse = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter,
  });

  return (queryResponse.matches || []).map(match => ({
    id: match.id,
    score: match.score || 0,
    content: (match.metadata?.content as string) || '',
    metadata: match.metadata || {},
  }));
}

/**
 * Delete all vectors (use with caution!)
 */
export async function deleteAllVectors(): Promise<void> {
  const index = getIndex();
  await index.deleteAll();
  console.log('[Pinecone] All vectors deleted');
}

/**
 * Get index stats
 */
export async function getIndexStats(): Promise<any> {
  const index = getIndex();
  return await index.describeIndexStats();
}

export { INDEX_NAME };
