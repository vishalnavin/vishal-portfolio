import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Chunk text to approximately 1,000 characters with ~150 character overlap for denser recall
function chunkText(text, chunkSize = 1000, overlap = 150) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk);
    // Ensure we make progress
    const nextStart = end - overlap;
    if (nextStart <= start) {
      start = end;
    } else {
      start = nextStart;
    }
  }
  
  return chunks;
}

// Extract title and section from markdown content
function extractTitle(content) {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1].trim() : '';
}

// Extract section heading for a chunk
function extractSection(content, chunkStart) {
  // Find the last ## heading before this chunk
  const beforeChunk = content.substring(0, chunkStart);
  const sectionMatches = beforeChunk.match(/##\s+(.+)$/gm);
  if (sectionMatches && sectionMatches.length > 0) {
    return sectionMatches[sectionMatches.length - 1].replace(/^##\s+/, '').trim();
  }
  return '';
}

async function buildIndex() {
  try {
    console.log('🚀 Starting index build...');
    
    const dataDir = join(process.cwd(), 'data');
    const files = readdirSync(dataDir).filter(file => 
      file.endsWith('.md') || file.endsWith('.txt')
    );
    
    console.log(`📁 Found ${files.length} files to process`);
    
    const index = pinecone.index(process.env.PINECONE_INDEX);
    const embedModel = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';
    
    // Test embedding dimensions first
    console.log(`🔍 Testing embedding model: ${embedModel}`);
    const testEmbedding = await openai.embeddings.create({
      model: embedModel,
      input: 'test',
    });
    const embeddingDimension = testEmbedding.data[0].embedding.length;
    console.log(`📏 Embedding dimension: ${embeddingDimension}`);
    
    let totalChunks = 0;
    
    for (const file of files) {
      console.log(`📄 Processing ${file}...`);
      
      const filePath = join(dataDir, file);
      const content = readFileSync(filePath, 'utf-8');
      const title = extractTitle(content) || file.replace(/\.(md|txt)$/, '');
      const chunks = chunkText(content);
      
      console.log(`   Split into ${chunks.length} chunks`);
      
      // Create embeddings for chunks
      const embeddings = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Find where this chunk starts in the original content
        const chunkStart = content.indexOf(chunk);
        const section = extractSection(content, chunkStart);
        
        try {
          const embeddingResponse = await openai.embeddings.create({
            model: embedModel,
            input: chunk,
          });
          
          const embedding = embeddingResponse.data[0].embedding;
          
          embeddings.push({
            id: `${file}-chunk-${i}`,
            values: embedding,
            metadata: {
              source: file,
              title: title,
              section: section,
              chunk: i + 1,
              text: chunk.substring(0, 1000), // Truncate to safe size
            },
          });
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`   Error embedding chunk ${i + 1}:`, error.message);
        }
      }
      
      // Upsert to Pinecone in batches
      if (embeddings.length > 0) {
        try {
          await index.upsert(embeddings);
          console.log(`   ✅ Upserted ${embeddings.length} chunks to Pinecone`);
          totalChunks += embeddings.length;
        } catch (error) {
          if (error.message.includes('Vector dimension') && error.message.includes('does not match')) {
            console.error(`   ❌ Dimension mismatch error: ${error.message}`);
            console.error(`   💡 Solution: Recreate your Pinecone index with dimension ${embeddingDimension}`);
            console.error(`   💡 Or use a different embedding model that produces 512-dimensional vectors`);
            process.exit(1);
          } else {
            console.error(`   ❌ Error upserting chunks:`, error.message);
          }
        }
      }
    }
    
    console.log(`🎉 Indexing complete! Total chunks: ${totalChunks}`);
    
  } catch (error) {
    console.error('❌ Index build failed:', error);
    process.exit(1);
  }
}

// Check required environment variables
const requiredEnvVars = ['OPENAI_API_KEY', 'PINECONE_API_KEY', 'PINECONE_INDEX'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please set these variables before running the script.');
  process.exit(1);
}

buildIndex();
