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

// Chunk text to approximately 1,500 characters with ~200 character overlap
function chunkText(text, chunkSize = 1500, overlap = 200) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk);
    start = end - overlap;
  }
  
  return chunks;
}

// Extract title from markdown content
function extractTitle(content) {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1].trim() : '';
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
          console.error(`   ❌ Error upserting chunks:`, error.message);
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
