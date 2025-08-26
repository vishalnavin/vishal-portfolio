const OpenAI = require('openai');
const { Pinecone } = require('@pinecone-database/pinecone');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Simple in-memory rate limiting (suitable for Netlify Functions)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 20; // 20 requests per hour

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

    // Embed the question
    const embedModel = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';
    const embeddingResponse = await openai.embeddings.create({
      model: embedModel,
      input: truncatedQuestion,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Query Pinecone with controlled parameters
    const index = pinecone.index(process.env.PINECONE_INDEX);
    const queryResponse = await index.query({
      vector: embedding,
      topK: 4, // Reduced from 5 for cost control
      includeMetadata: true,
    });

    // Check if we have any relevant results
    if (!queryResponse.matches || queryResponse.matches.length === 0) {
      console.log(`[${new Date().toISOString()}] No relevant results found for question: "${truncatedQuestion.substring(0, 50)}..."`);
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
        }),
      };
    }

    // Build grounded prompt with controlled text length
    const snippets = queryResponse.matches?.map((match, idx) => {
      const metadata = match.metadata;
      const text = metadata.text ? metadata.text.substring(0, 300) : ''; // Limit snippet length
      return `[${idx + 1}] ${metadata.title ? `(${metadata.title}) ` : ''}${text}`;
    }).join('\n\n') || '';

    const systemPrompt = process.env.BOT_SYSTEM_PROMPT || 
      'You are Vishal\'s portfolio assistant. Answer in concise UK English using ONLY the provided context. If unsure, say "I don\'t know" and suggest contacting Vishal at vishalnavin@gmail.com. Keep answers under 200 words.';

    const chatModel = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';
    const chatResponse = await openai.chat.completions.create({
      model: chatModel,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Context:\n${snippets}\n\nQuestion: ${truncatedQuestion}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 250, // Explicit token limit
    });

    const answer = chatResponse.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Extract and deduplicate sources
    const sources = queryResponse.matches?.reduce((acc, match, idx) => {
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
    }, []) || [];

    const response = {
      answer,
      sources,
    };

    // Log success metrics (anonymised)
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Success - Q: ${truncatedQuestion.length} chars, A: ${answer.length} chars, Sources: ${sources.length}, Duration: ${duration}ms`);

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
