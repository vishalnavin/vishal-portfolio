# RAG Chatbot Notes

## Local Development

### Running the Indexer

To build the knowledge base locally:

```bash
npm run rag:index
```

**Required Environment Variables:**
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_EMBED_MODEL` - Embedding model (default: text-embedding-3-small)
- `PINECONE_API_KEY` - Your Pinecone API key
- `PINECONE_INDEX` - Your Pinecone index name

### Knowledge Base Management

- **Location**: `/data` folder at repo root
- **File Types**: `.md` and `.txt` files
- **After Changes**: Re-run `npm run rag:index` to update the vector database

## Deployment

Environment variables are set in Netlify deploy previews, not in production. The following variables are required:

- `OPENAI_API_KEY`
- `OPENAI_EMBED_MODEL` (default: text-embedding-3-small)
- `OPENAI_CHAT_MODEL` (default: gpt-4o-mini)
- `PINECONE_API_KEY`
- `PINECONE_INDEX`
- `BOT_SYSTEM_PROMPT` (optional, has sensible default)

## Testing

Suggested test prompts:
- "What did Vishal do at Rockstar?"
- "Show me your projects"
- "How can I contact you?"
- "What's your educational background?"
- "What tools do you use?"

## Architecture

- **Frontend**: Floating chat widget in bottom-right corner
- **Backend**: Netlify function at `/api/chat`
- **Vector DB**: Pinecone for similarity search
- **Embeddings**: OpenAI text-embedding-3-small
- **Chat Model**: GPT-4o-mini with low temperature (0.2)

The chatbot provides grounded answers based on the portfolio content and shows source citations.

---

## Operator Guide

### Knowledge Base Management

#### Adding/Editing Content
1. **Edit files** in `/data/` directory:
   - `about.md` - General information about Vishal
   - `cv.md` - CV highlights and experience
   - `projects-rockstar.md` - Rockstar Games project details
   - `projects-coalition.md` - Coalition Greenwich project details
   - `faq.md` - Frequently asked questions

2. **Re-index after changes**:
   ```bash
   npm run rag:index
   ```
   This will:
   - Read all markdown files from `/data/`
   - Chunk them (~1500 chars with ~200 overlap)
   - Create embeddings using OpenAI
   - Upsert to Pinecone index

#### Content Guidelines
- Use clear H1 titles for each file
- Keep content factual and concise
- Include relevant keywords for better retrieval
- Update FAQ with common questions

### Environment Variables

#### Required Variables (set in Netlify)
1. `OPENAI_API_KEY` - Your OpenAI API key (sk-proj-****)
2. `OPENAI_EMBED_MODEL` - Embedding model (default: text-embedding-3-small)
3. `OPENAI_CHAT_MODEL` - Chat model (default: gpt-4o-mini)
4. `PINECONE_API_KEY` - Your Pinecone API key (pcsk_****)
5. `PINECONE_INDEX` - Index name (vishal-portfolio-1536)
6. `BOT_SYSTEM_PROMPT` - System prompt for the chatbot

#### Where to Set Variables
- **Deploy Previews**: Set in Netlify dashboard → Site settings → Environment variables → Deploy previews
- **Production**: Set in Netlify dashboard → Site settings → Environment variables → Production

#### Local Development
For local testing, export variables in your shell:
```bash
export OPENAI_API_KEY="your_key"
export PINECONE_API_KEY="your_key"
export PINECONE_INDEX="vishal-portfolio-1536"
# ... etc
```

### Common Issues & Solutions

#### OpenAI API Errors
- **429 Rate Limit**: Function returns graceful fallback message
- **401 Unauthorized**: Check API key is valid and has credits
- **Insufficient Quota**: Add billing or use different API key

#### Pinecone Errors
- **Index not found**: Ensure `PINECONE_INDEX` matches existing index
- **Dimension mismatch**: Index must be 1536 dimensions for text-embedding-3-small
- **Authentication failed**: Check `PINECONE_API_KEY` is valid

#### Function Errors
- **500 Internal Error**: Check all environment variables are set
- **404 Not Found**: Ensure redirect `/api/chat` → `/.netlify/functions/chat` is configured
- **Rate limit exceeded**: Wait 1 hour or use different IP

#### Local Development Issues
- **Port conflicts**: Use `npx netlify dev --port 8888`
- **Function not loading**: Restart dev server after environment changes
- **Redirect not working**: Call `/.netlify/functions/chat` directly in development

### Performance & Cost Optimization

#### Current Limits
- **Rate limiting**: 20 requests/hour per IP
- **Token limit**: 250 max tokens per response
- **Input truncation**: 600 characters max
- **Retrieval**: topK=4 chunks per query

#### Monitoring
- Check Netlify function logs for performance metrics
- Monitor OpenAI API usage in dashboard
- Watch Pinecone index usage and costs

#### Cost Control
- Token limits prevent runaway costs
- Rate limiting prevents abuse
- Efficient retrieval (topK=4) reduces embedding costs
- Graceful fallbacks prevent unnecessary API calls
