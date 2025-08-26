# RAG Chatbot Deployment Guide

## Environment Variables for Production

Set these environment variables in your Netlify deployment:

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_EMBED_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4o-mini
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=vishal-portfolio
BOT_SYSTEM_PROMPT=You are Vishal's portfolio assistant. Answer in concise UK English using ONLY the provided context. If unsure, say you don't know and offer a contact option.
```

## Deployment Steps

1. **Push to GitHub**:
   ```bash
   git push origin feature/rag-chatbot
   ```

2. **Deploy to Netlify**:
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables in Netlify dashboard

3. **Build the Knowledge Base**:
   ```bash
   npm run rag:index
   ```

## API Limits Handling

The chatbot now handles OpenAI API quota limits gracefully:
- Returns a friendly message when API limits are exceeded
- Provides contact information for immediate assistance
- Shows a warning indicator in the chat interface

## Testing Production

1. Visit your deployed site
2. Click the chat button (bottom-right corner)
3. Ask questions like:
   - "What did Vishal do at Rockstar?"
   - "How can I contact you?"
   - "What's your educational background?"

## Troubleshooting

- **API Limits**: The chatbot will show a fallback message
- **Function Not Found**: Ensure environment variables are set
- **Empty Responses**: Run `npm run rag:index` to populate the knowledge base

## Local Development

```bash
# Start local server
npx netlify dev --port 8888

# Test API directly
curl -X POST http://localhost:8888/.netlify/functions/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"What did Vishal do at Rockstar?"}'
```
