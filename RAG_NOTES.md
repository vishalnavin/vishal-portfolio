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
