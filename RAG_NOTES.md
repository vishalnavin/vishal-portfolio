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

## Tuning Behaviour

### Retrieval Configuration Knobs

The chatbot uses several environment variables to tune retrieval and response behaviour:

- `RAG_TOPK_BASE=6` - Initial retrieval candidates per query variant
- `RAG_TOPK_FINAL=5` - Final candidates after MMR diversification  
- `RAG_MMR_LAMBDA=0.7` - MMR diversity vs relevance balance (0.0-1.0)
- `RAG_SCORE_THRESHOLD=0.35` - Minimum similarity score for direct answers

### Clarification Policy

The chatbot implements a decisive answering strategy:

1. **Compute maxScore** from retrieved candidates
2. **If maxScore < 0.35 or no candidates** → return a single clarifying question
3. **Else** → answer directly (no clarifying question)
4. **Enforce one-clarify maximum**: if last assistant message was clarifying and user replied, must answer directly next

This prevents unnecessary back-and-forth while ensuring quality responses when confidence is sufficient.

### Response Controls

- **Temperature**: 0.2 for consistent, factual responses
- **Max tokens**: ~220 to keep answers concise
- **Input truncation**: 800 characters to prevent abuse
- **Citations**: Short format [1], [2] from provided context only

### Diagnostics

Console logs include anonymised metrics per request:
- Question length
- MaxScore and threshold comparison
- Candidate count pre/post MMR
- Low confidence trigger status
- Elapsed milliseconds

No PII or secrets are logged.

## Adaptive Prompt Behaviour

The chatbot automatically switches between two modes based on question content:

### Portfolio Mode (Default)
- **Trigger**: General portfolio questions
- **Prompt**: "You are Vishal's portfolio assistant. Use only the provided context. Respond in concise UK English. Prefer direct answers when context is sufficient. Include short citations like [1], [2]. If context is weak, ask one clarifying question; if still unknown, say you don't know and suggest contacting Vishal."

### Interview Mode
- **Trigger**: Recruiter-style keywords (hire, achievement, strength, weakness, challenge, leadership, five years)
- **Prompt**: "You are Vishal's interview coach and portfolio assistant. Answer as if Vishal is responding in an interview: confident, concise, factual, and grounded in the provided context. Always cite from [FAQ], [Projects], [Highlights], or [Skills]."

This ensures appropriate tone and content for different types of questions.

## Re-test Procedure

After each re-index or significant changes, run the comprehensive test suite:

### Prerequisites
```bash
# Set environment variables
export OPENAI_API_KEY="your_key"
export PINECONE_API_KEY="your_key"
export PINECONE_INDEX="vishal-portfolio-1536"
export OPENAI_EMBED_MODEL="text-embedding-3-small"
export OPENAI_CHAT_MODEL="gpt-4o-mini"
```

### Test Execution
```bash
# Start local server
npx netlify dev --port 8888

# In another terminal, run test suite
node test-chatbot.js
```

### Expected Results
- **8 test questions** covering portfolio and interview scenarios
- **All tests should pass** with at least partial keyword matches
- **Adaptive prompts** working correctly (interview vs portfolio mode)
- **Response quality** high with proper citations and UK English

### Test Coverage
1. Rockstar Games work (PySpark, telemetry, retention)
2. Coalition Greenwich ML techniques (Gradient Boosting, Random Forest)
3. Interview questions (hire, achievements, tools)
4. Contact information (email, LinkedIn)
5. Career timeline and industry experience

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

#### Retrieval Tuning Variables (optional)
1. `RAG_TOPK_BASE` - Initial candidates per query (default: 6)
2. `RAG_TOPK_FINAL` - Final candidates after MMR (default: 5)
3. `RAG_MMR_LAMBDA` - Diversity vs relevance balance (default: 0.7)
4. `RAG_SCORE_THRESHOLD` - Minimum score for direct answers (default: 0.35)

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
- **Token limit**: 220 max tokens per response
- **Input truncation**: 800 characters max
- **Retrieval**: topK=6 base, topK=5 final chunks per query

#### Monitoring
- Check Netlify function logs for performance metrics
- Monitor OpenAI API usage in dashboard
- Watch Pinecone index usage and costs

#### Cost Control
- Token limits prevent runaway costs
- Rate limiting prevents abuse
- Efficient retrieval (topK=6→5) reduces embedding costs
- Graceful fallbacks prevent unnecessary API calls
