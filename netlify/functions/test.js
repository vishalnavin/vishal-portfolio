exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: 'Netlify Functions are working!',
      timestamp: new Date().toISOString(),
      env: {
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasPinecone: !!process.env.PINECONE_API_KEY,
        hasIndex: !!process.env.PINECONE_INDEX,
        indexName: process.env.PINECONE_INDEX || 'not set'
      }
    }),
  };
};
