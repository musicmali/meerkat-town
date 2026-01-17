// ============================================================================
// RAG - Retrieval Service
// ============================================================================
// Retrieves relevant context for user queries
// ============================================================================

import { getEmbedding } from './embeddings';
import { querySimilar } from './vectorStore';

/**
 * Retrieved context result
 */
export interface RetrievedContext {
  content: string;
  sources: Array<{
    title: string;
    source: string;
    relevance: number;
  }>;
}

/**
 * Retrieve relevant context for a query
 */
export async function retrieveContext(
  query: string,
  options: {
    topK?: number;
    minScore?: number;
    category?: string;
    agentId?: number;
  } = {}
): Promise<RetrievedContext> {
  const { topK = 5, minScore = 0.7, category, agentId } = options;

  try {
    // Create embedding for the query
    const queryEmbedding = await getEmbedding(query);

    // Build filter if needed
    let filter: Record<string, any> | undefined;
    if (category || agentId) {
      filter = {};
      if (category) filter.category = { $eq: category };
      if (agentId) filter.agentId = { $eq: agentId };
    }

    // Query similar vectors
    const results = await querySimilar(queryEmbedding, topK, filter);

    // Filter by minimum score
    const relevantResults = results.filter(r => r.score >= minScore);

    if (relevantResults.length === 0) {
      return { content: '', sources: [] };
    }

    // Format context for the LLM
    const contextParts = relevantResults.map((r, i) => {
      return `[Source ${i + 1}: ${r.metadata.title}]\n${r.content}`;
    });

    const sources = relevantResults.map(r => ({
      title: r.metadata.title as string,
      source: r.metadata.source as string,
      relevance: Math.round(r.score * 100),
    }));

    console.log(`[RAG] Retrieved ${relevantResults.length} relevant chunks for query: "${query.substring(0, 50)}..."`);

    return {
      content: contextParts.join('\n\n---\n\n'),
      sources,
    };
  } catch (error) {
    console.error('[RAG] Retrieval error:', error);
    return { content: '', sources: [] };
  }
}

/**
 * Check if RAG is available (Pinecone configured and has data)
 */
export async function isRAGAvailable(): Promise<boolean> {
  try {
    if (!process.env.PINECONE_API_KEY) {
      return false;
    }
    // Could also check if index has vectors
    return true;
  } catch {
    return false;
  }
}

/**
 * Format context for injection into system prompt
 */
export function formatContextForPrompt(context: RetrievedContext): string {
  if (!context.content) {
    return '';
  }

  return `
## Relevant Knowledge Base Information:
${context.content}

Note: Use this information to help answer the user's question. Cite sources when using this information.
`;
}
