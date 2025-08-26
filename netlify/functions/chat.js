const OpenAI = require('openai');
const { Pinecone } = require('@pinecone-database/pinecone');

// Simple in-memory rate limiting (suitable for Netlify Functions)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 20; // 20 requests per hour

// RAG configuration knobs
const RAG_TOPK_BASE = parseInt(process.env.RAG_TOPK_BASE) || 6;
const RAG_TOPK_FINAL = parseInt(process.env.RAG_TOPK_FINAL) || 5;
const RAG_MMR_LAMBDA = parseFloat(process.env.RAG_MMR_LAMBDA) || 0.7;
const RAG_SCORE_THRESHOLD = parseFloat(process.env.RAG_SCORE_THRESHOLD) || 0.5;

function checkRateLimit(clientIP) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimitMap.has(clientIP)) {
    rateLimitMap.set(clientIP, []);
  }
  
  const requests = rateLimitMap.get(clientIP);
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (validRequests.length >= RATE_LIMIT_MAX) {
    return false;
  }
  
  validRequests.push(now);
  rateLimitMap.set(clientIP, validRequests);
  return true;
}

// Query expansion: generate paraphrases for better retrieval
async function expandQuery(openai, question) {
  try {
    const expansionPrompt = `Generate 3 different ways to ask this question, keeping the same meaning but using different words. Return only the paraphrases, one per line, no numbering:

Original: ${question}`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: expansionPrompt }],
      temperature: 0.3,
      max_tokens: 100,
    });

    const paraphrases = response.choices[0]?.message?.content
      ?.split('\n')
      ?.filter(line => line.trim().length > 0)
      ?.slice(0, 3) || [];

    return [question, ...paraphrases];
  } catch (error) {
    console.log(`[${new Date().toISOString()}] Query expansion failed, using original: ${error.message}`);
    return [question];
  }
}

// MMR diversification to reduce near-duplicates
function mmrDiversify(candidates, lambda = RAG_MMR_LAMBDA) {
  if (candidates.length <= RAG_TOPK_FINAL) return candidates.slice(0, RAG_TOPK_FINAL);
  
  const selected = [candidates[0]]; // Start with highest scoring
  const remaining = candidates.slice(1);
  
  while (selected.length < RAG_TOPK_FINAL && remaining.length > 0) {
    let bestIdx = 0;
    let bestScore = -1;
    
    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      
      // Relevance score (original similarity)
      const relevance = candidate.score;
      
      // Diversity score (max similarity to already selected)
      let maxSimilarity = 0;
      for (const selectedItem of selected) {
        const similarity = calculateSimilarity(candidate, selectedItem);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
      
      // MMR score
      const mmrScore = lambda * relevance + (1 - lambda) * (1 - maxSimilarity);
      
      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIdx = i;
      }
    }
    
    selected.push(remaining[bestIdx]);
    remaining.splice(bestIdx, 1);
  }
  
  return selected;
}

// Simple similarity calculation based on metadata
function calculateSimilarity(a, b) {
  if (a.metadata.source === b.metadata.source && a.metadata.chunk === b.metadata.chunk) {
    return 1.0; // Same chunk
  }
  if (a.metadata.title === b.metadata.title) {
    return 0.5; // Same document
  }
  return 0.1; // Different documents
}

// Lightweight re-ranking using LLM
async function rerankCandidates(openai, question, candidates) {
  if (candidates.length <= 3) return candidates; // No need to rerank small sets
  
  try {
    const rerankPrompt = `Rate each snippet's relevance to the question from 0-3 (0=irrelevant, 3=highly relevant). Return only numbers separated by commas:

Question: ${question}

Snippets:
${candidates.map((c, i) => `${i + 1}. ${c.metadata.text?.substring(0, 200)}...`).join('\n')}

Ratings:`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: rerankPrompt }],
      temperature: 0.1,
      max_tokens: 50,
    });

    const ratings = response.choices[0]?.message?.content
      ?.split(',')
      ?.map(r => parseInt(r.trim()))
      ?.filter(r => !isNaN(r) && r >= 0 && r <= 3) || [];

    if (ratings.length === candidates.length) {
      // Sort by rerank score, then by original score as tiebreaker
      return candidates
        .map((candidate, i) => ({ ...candidate, rerankScore: ratings[i] }))
        .sort((a, b) => b.rerankScore - a.rerankScore || b.score - a.score)
        .slice(0, Math.min(5, candidates.length));
    }
  } catch (error) {
    console.log(`[${new Date().toISOString()}] Re-ranking failed: ${error.message}`);
  }
  
  return candidates.slice(0, 5);
}

exports.handler = async function(event, context) {
  const startTime = Date.now();
  const clientIP = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';
  
  // Log request (anonymised)
  console.log(`[${new Date().toISOString()}] Request from IP: ${clientIP.substring(0, 8)}...`);
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Rate limiting
  if (!checkRateLimit(clientIP)) {
    console.log(`[${new Date().toISOString()}] Rate limit exceeded for IP: ${clientIP.substring(0, 8)}...`);
    return {
      statusCode: 429,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: 3600
      }),
    };
  }

  try {
    const { question } = JSON.parse(event.body || '{}');

    // Input validation and truncation
    if (!question || typeof question !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Question is required and must be a string' }),
      };
    }
    
    // Truncate question to prevent abuse
    const truncatedQuestion = question.trim().substring(0, 600);
    if (truncatedQuestion.length !== question.trim().length) {
      console.log(`[${new Date().toISOString()}] Question truncated from ${question.length} to ${truncatedQuestion.length} chars`);
    }
    
    if (truncatedQuestion.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Question cannot be empty' }),
      };
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    // Phase 1: Smart Retrieval
    console.log(`[${new Date().toISOString()}] Starting smart retrieval for: "${truncatedQuestion.substring(0, 50)}..."`);
    
    // 1. Query expansion
    const queryVariants = await expandQuery(openai, truncatedQuestion);
    console.log(`[${new Date().toISOString()}] Generated ${queryVariants.length} query variants`);
    
    // 2. Embed all variants
    const embedModel = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';
    const embeddings = await Promise.all(
      queryVariants.map(variant => 
        openai.embeddings.create({
          model: embedModel,
          input: variant,
        })
      )
    );
    
    // 3. Query Pinecone with all variants
    const index = pinecone.index(process.env.PINECONE_INDEX);
    const queryPromises = embeddings.map(embeddingResponse => 
      index.query({
        vector: embeddingResponse.data[0].embedding,
        topK: RAG_TOPK_BASE,
        includeMetadata: true,
      })
    );
    
    const queryResults = await Promise.all(queryPromises);
    
    // 4. Merge and deduplicate results
    const allMatches = [];
    queryResults.forEach((result, variantIdx) => {
      result.matches?.forEach(match => {
        const key = `${match.metadata.source}-${match.metadata.chunk}`;
        const existing = allMatches.find(m => `${m.metadata.source}-${m.metadata.chunk}` === key);
        
        if (!existing || match.score > existing.score) {
          if (existing) {
            const idx = allMatches.indexOf(existing);
            allMatches[idx] = match;
          } else {
            allMatches.push(match);
          }
        }
      });
    });
    
    console.log(`[${new Date().toISOString()}] Retrieved ${allMatches.length} unique candidates`);
    
    // 5. MMR diversification
    const diverseCandidates = mmrDiversify(allMatches);
    console.log(`[${new Date().toISOString()}] After MMR: ${diverseCandidates.length} diverse candidates`);
    
    // 6. Score threshold check
    const maxScore = diverseCandidates.length > 0 ? Math.max(...diverseCandidates.map(c => c.score)) : 0;
    const lowConfidence = maxScore < RAG_SCORE_THRESHOLD;
    
    console.log(`[${new Date().toISOString()}] Max score: ${maxScore.toFixed(3)}, threshold: ${RAG_SCORE_THRESHOLD}, low confidence: ${lowConfidence}`);
    
    // 7. Lightweight re-ranking
    const finalCandidates = await rerankCandidates(openai, truncatedQuestion, diverseCandidates);
    console.log(`[${new Date().toISOString()}] Final candidates after re-ranking: ${finalCandidates.length}`);
    
    // Fallback if no relevant results
    if (finalCandidates.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify({
          answer: "I don't have enough information to answer that question. Please contact me directly at vishalnavin@gmail.com for more specific information.",
          sources: [],
          lowConfidence: true,
        }),
      };
    }

    // Phase 2: Context Compression (simplified for now)
    const compressedSnippets = finalCandidates.map((match, idx) => {
      const metadata = match.metadata;
      const text = metadata.text ? metadata.text.substring(0, 300) : ''; // Limit snippet length
      return `[${idx + 1}] ${metadata.title ? `(${metadata.title}) ` : ''}${text}`;
    }).join('\n\n');

    // Phase 3: Improved System Prompt
    const systemPrompt = process.env.BOT_SYSTEM_PROMPT || 
      'You are Vishal\'s portfolio assistant. Use only the provided context. Respond in concise UK English. Prefer specifics (roles, tools, outcomes). Include short citations like [1], [2]. If the context is weak, ask a brief clarifying question first. If still unknown after clarification, say you don\'t know and suggest contacting Vishal.';

    // Handle low confidence with clarifying questions
    if (lowConfidence) {
      const clarifyingPrompt = `Given this context, generate a single short clarifying question to help understand what the user is asking about:

Context:
${compressedSnippets}

User question: ${truncatedQuestion}

Generate one clarifying question (max 100 words):`;

      const clarifyingResponse = await openai.chat.completions.create({
        model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: clarifyingPrompt }],
        temperature: 0.2,
        max_tokens: 100,
      });

      const clarifyingQuestion = clarifyingResponse.choices[0]?.message?.content || 
        "Could you be more specific about what you'd like to know?";

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify({
          answer: clarifyingQuestion,
          sources: [],
          lowConfidence: true,
          clarifyingQuestion: true,
        }),
      };
    }

    // Generate final answer
    const chatModel = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';
    const chatResponse = await openai.chat.completions.create({
      model: chatModel,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Context:\n${compressedSnippets}\n\nQuestion: ${truncatedQuestion}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 250, // Explicit token limit
    });

    const answer = chatResponse.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Extract and deduplicate sources
    const sources = finalCandidates.reduce((acc, match, idx) => {
      const metadata = match.metadata;
      const source = {
        idx: idx + 1,
        title: metadata.title || 'Unknown',
        source: metadata.source || 'Unknown',
      };
      
      // Deduplicate by title/source
      const exists = acc.find(s => s.title === source.title && s.source === source.source);
      if (!exists) {
        acc.push(source);
      }
      return acc;
    }, []);

    const response = {
      answer,
      sources,
      lowConfidence,
    };

    // Log success metrics (anonymised)
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Success - Q: ${truncatedQuestion.length} chars, A: ${answer.length} chars, Sources: ${sources.length}, Duration: ${duration}ms, Low confidence: ${lowConfidence}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] Error after ${duration}ms:`, error.message);
    
    // Handle API quota limits gracefully
    if (error.status === 429 || error.code === 'insufficient_quota') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify({
          answer: "I'm currently experiencing high demand and can't process your request right now. Please try again later or contact me directly at vishalnavin@gmail.com for immediate assistance.",
          sources: [],
          apiLimit: true
        }),
      };
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
