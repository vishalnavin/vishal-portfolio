const OpenAI = require('openai');
const { Pinecone } = require('@pinecone-database/pinecone');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { question } = JSON.parse(event.body || '{}');

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
    const index = pinecone.index(process.env.PINECONE_INDEX);
    const queryResponse = await index.query({
      vector: embedding,
      topK: 5,
      includeMetadata: true,
    });

    // Build grounded prompt
    const snippets = queryResponse.matches?.map((match, idx) => {
      const metadata = match.metadata;
      return `[${idx + 1}] ${metadata.title ? `(${metadata.title}) ` : ''}${metadata.text}`;
    }).join('\n\n') || '';

    const systemPrompt = process.env.BOT_SYSTEM_PROMPT || 
      'You are a helpful AI assistant for a portfolio website. Answer questions based on the provided context only. Use concise UK English. If you cannot answer from the context, say "I don\'t know" and suggest contacting the person directly.';

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
      temperature: 0.2,
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
