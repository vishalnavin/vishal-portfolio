import { Handler } from '@netlify/functions';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

interface ChatRequest {
  question: string;
}

interface ChatResponse {
  answer: string;
  sources: Array<{
    idx: number;
    title: string;
    source: string;
  }>;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { question }: ChatRequest = JSON.parse(event.body || '{}');

    if (!question) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Question is required' }),
      };
    }

    // Embed the question
    const embedModel = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';
    const embeddingResponse = await openai.embeddings.create({
      model: embedModel,
      input: question,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Query Pinecone
    const index = pinecone.index(process.env.PINECONE_INDEX!);
    const queryResponse = await index.query({
      vector: embedding,
      topK: 5,
      includeMetadata: true,
    });

    // Build grounded prompt
    const snippets = queryResponse.matches?.map((match, idx) => {
      const metadata = match.metadata as any;
      return `[${idx + 1}] ${metadata.text}`;
    }).join('\n\n') || '';

    const systemPrompt = process.env.BOT_SYSTEM_PROMPT || 
      'You are a helpful AI assistant for a portfolio website. Answer questions based on the provided context. Always cite sources using [1], [2], etc. If you cannot answer from the context, say so.';

    const chatModel = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';
    const chatResponse = await openai.chat.completions.create({
      model: chatModel,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Context:\n${snippets}\n\nQuestion: ${question}`,
        },
      ],
      temperature: 0.7,
    });

    const answer = chatResponse.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Extract and deduplicate sources
    const sources = queryResponse.matches?.reduce((acc, match, idx) => {
      const metadata = match.metadata as any;
      const source = {
        idx: idx + 1,
        title: metadata.title || 'Unknown',
        source: metadata.source || 'Unknown',
      };
      
      // Deduplicate by source
      const exists = acc.find(s => s.source === source.source);
      if (!exists) {
        acc.push(source);
      }
      return acc;
    }, [] as Array<{ idx: number; title: string; source: string }>) || [];

    const response: ChatResponse = {
      answer,
      sources,
    };

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
    console.error('Chat function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
