// ============================================================================
// Knowledge Base Ingestion Script
// ============================================================================
// Run this script to ingest all knowledge documents into Pinecone
// Usage: npx tsx scripts/ingest-knowledge.ts
// ============================================================================

import { config } from 'dotenv';
import { ingestFromDirectory, getIndexStats } from '../rag';
import * as path from 'path';

// Load environment variables
config();

async function main() {
  console.log('='.repeat(60));
  console.log('MEERKAT KNOWLEDGE BASE INGESTION');
  console.log('='.repeat(60));

  const knowledgeDir = path.join(__dirname, '..', 'knowledge');

  console.log(`\nIngesting documents from: ${knowledgeDir}\n`);

  try {
    const chunksIngested = await ingestFromDirectory(knowledgeDir, 'crypto');

    console.log('\n' + '='.repeat(60));
    console.log(`SUCCESS: Ingested ${chunksIngested} chunks`);
    console.log('='.repeat(60));

    // Show index stats
    const stats = await getIndexStats();
    console.log('\nIndex Stats:');
    console.log(JSON.stringify(stats, null, 2));

  } catch (error) {
    console.error('\nERROR:', error);
    process.exit(1);
  }
}

main();
