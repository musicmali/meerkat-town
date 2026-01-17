// ============================================================================
// RAG - Document Ingestion
// ============================================================================
// Processes documents and stores them in the vector database
// ============================================================================

import { getEmbeddings } from './embeddings';
import { upsertVectors, initializeIndex, type DocumentChunk } from './vectorStore';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Split text into chunks with overlap
 */
function chunkText(
  text: string,
  maxChunkSize: number = 500,
  overlap: number = 50
): string[] {
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // If paragraph alone is too big, split by sentences
    if (paragraph.length > maxChunkSize) {
      const sentences = paragraph.split(/[.!?]+\s+/);
      for (const sentence of sentences) {
        if ((currentChunk + ' ' + sentence).length > maxChunkSize && currentChunk) {
          chunks.push(currentChunk.trim());
          // Keep overlap from previous chunk
          const words = currentChunk.split(' ');
          currentChunk = words.slice(-Math.floor(overlap / 5)).join(' ') + ' ' + sentence;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }
    } else {
      if ((currentChunk + '\n\n' + paragraph).length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(c => c.length > 20); // Filter out tiny chunks
}

/**
 * Document source for ingestion
 */
export interface DocumentSource {
  title: string;
  content: string;
  source: string;
  category?: string;
  agentId?: number;
}

/**
 * Ingest documents into the vector store
 */
export async function ingestDocuments(documents: DocumentSource[]): Promise<number> {
  console.log(`[Ingest] Processing ${documents.length} documents...`);

  // Initialize index if needed
  await initializeIndex();

  const allChunks: DocumentChunk[] = [];

  // Process each document
  for (const doc of documents) {
    const chunks = chunkText(doc.content);
    console.log(`[Ingest] "${doc.title}" -> ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      allChunks.push({
        id: `${doc.source.replace(/[^a-zA-Z0-9]/g, '_')}_${i}`,
        content: chunks[i],
        metadata: {
          source: doc.source,
          title: doc.title,
          category: doc.category || 'general',
          agentId: doc.agentId,
        },
      });
    }
  }

  console.log(`[Ingest] Total chunks: ${allChunks.length}`);

  // Create embeddings in batches
  console.log('[Ingest] Creating embeddings...');
  const embeddings = await getEmbeddings(allChunks.map(c => c.content));

  // Upsert to Pinecone
  console.log('[Ingest] Upserting to Pinecone...');
  await upsertVectors(allChunks, embeddings);

  console.log(`[Ingest] Successfully ingested ${allChunks.length} chunks`);
  return allChunks.length;
}

/**
 * Ingest markdown files from a directory
 */
export async function ingestFromDirectory(dirPath: string, category?: string): Promise<number> {
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md') || f.endsWith('.txt'));
  const documents: DocumentSource[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
    documents.push({
      title: file.replace(/\.(md|txt)$/, ''),
      content,
      source: file,
      category,
    });
  }

  return await ingestDocuments(documents);
}

/**
 * Ingest a single document string
 */
export async function ingestText(
  title: string,
  content: string,
  category?: string,
  agentId?: number
): Promise<number> {
  return await ingestDocuments([{
    title,
    content,
    source: title.toLowerCase().replace(/\s+/g, '-'),
    category,
    agentId,
  }]);
}
