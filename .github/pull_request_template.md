# Pull Request Template

## Title
`feat(rag): portfolio chatbot with Pinecone retrieval`

## Summary
This PR adds a RAG (Retrieval-Augmented Generation) chatbot to the portfolio website. The chatbot uses a Netlify Function backend with OpenAI embeddings and Pinecone vector database to provide grounded answers based on portfolio content. Users can ask questions about projects, experience, and contact information through a floating chat widget.

## What's Included
- **Knowledge Base**: `/data` directory with 5 markdown files (about, cv, projects, faq)
- **Indexer**: `npm run rag:index` task to build Pinecone vector index
- **Backend**: Netlify Function at `/api/chat` with OpenAI + Pinecone integration
- **Frontend**: Floating chat widget mounted in app shell
- **Configuration**: `netlify.toml` with redirect and function settings
- **Hardening**: Input validation, rate limiting (20/hr), token caps (250), temperature 0.2
- **Documentation**: `RAG_VERIFICATION.md` and `RAG_NOTES.md` with operator guide

## How to Run Locally
1. **Set environment variables**:
   ```bash
   export OPENAI_API_KEY="your_key"
   export PINECONE_API_KEY="your_key"
   export PINECONE_INDEX="vishal-portfolio-1536"
   export OPENAI_EMBED_MODEL="text-embedding-3-small"
   export OPENAI_CHAT_MODEL="gpt-4o-mini"
   export BOT_SYSTEM_PROMPT="You are Vishal's portfolio assistant..."
   ```

2. **Install dependencies**: `npm install`

3. **Build knowledge index**: `npm run rag:index`

4. **Start development server**: `npx netlify dev --port 8888`

5. **Test the API**: 
   ```bash
   curl -X POST http://localhost:8888/.netlify/functions/chat \
     -H "Content-Type: application/json" \
     -d '{"question":"What did Vishal do at Rockstar?"}'
   ```

6. **Test the widget**: Open http://localhost:8888 and click the chat button

## Re-indexing When Content Changes
- Edit files in `/data/*.md`
- Run `npm run rag:index` to rebuild the vector index
- Test with the same curl command above

## Test Plan (Deploy Preview)
Test these three prompts in the chat widget:
1. "What did Vishal do at Rockstar?"
2. "Show me your projects"
3. "How can I contact you?"

Expected: Concise, grounded answers with source citations.

## Risk & Rollback
- **Rate limiting**: 20 requests/hour per IP prevents abuse
- **Token caps**: 250 max tokens controls costs
- **Rollback**: Revert PR or use Netlify "Roll back" to prior deploy
- **Environment**: All secrets stored in Netlify environment variables

## Environment Variables Required
- `OPENAI_API_KEY` (sk-proj-****)
- `OPENAI_EMBED_MODEL` = text-embedding-3-small
- `OPENAI_CHAT_MODEL` = gpt-4o-mini
- `PINECONE_API_KEY` (pcsk_****)
- `PINECONE_INDEX` = vishal-portfolio-1536
- `BOT_SYSTEM_PROMPT` = "You are Vishal's portfolio assistant..."

## Files Changed
- `netlify/functions/chat.cjs` - Main chatbot function
- `src/components/ChatWidget.tsx` - Frontend chat widget
- `src/App.tsx` - Widget mounting
- `scripts/build-index.mjs` - Knowledge base indexer
- `netlify.toml` - Netlify configuration
- `package.json` - Dependencies and scripts
- `/data/*.md` - Knowledge base files
- `RAG_VERIFICATION.md` - Verification report
- `RAG_NOTES.md` - Operator documentation
