// ============================================================================
// RAG - Main Export
// ============================================================================

export { getEmbedding, getEmbeddings } from './embeddings';
export {
  initializeIndex,
  getIndex,
  upsertVectors,
  querySimilar,
  deleteAllVectors,
  getIndexStats,
  INDEX_NAME,
  type DocumentChunk
} from './vectorStore';
export {
  ingestDocuments,
  ingestFromDirectory,
  ingestText,
  type DocumentSource
} from './ingest';
export {
  retrieveContext,
  isRAGAvailable,
  formatContextForPrompt,
  type RetrievedContext
} from './retrieval';
