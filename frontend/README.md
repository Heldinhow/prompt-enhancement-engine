# Prompt Enhancement Engine (PEE)

Transform natural language into structured, optimized prompts for AI agents.

## Features

- 🎯 **Intent Extraction** - Identify goals and detect ambiguities
- 🏗️ **Domain Specialization** - Context-aware enhancements for coding, marketing, product, IA, automation
- 📊 **Quality Scoring** - Real-time metrics: Clarity, Specificity, Executability, Ambiguity Control, Structure
- ✨ **Structured Output** - Standardized prompt format with CONTEXT, ROLE, OBJECTIVE, SCOPE, RESTRICTIONS, OUTPUT FORMAT, QUALITY CRITERIA, EXECUTION STEPS, EDGE CASES
- 🔄 **Continuous Improvement** - Auto-refine if score < 8

## Demo

![PEE Demo](https://factory.ai/favicon.ico)

**Live Demo:** http://76.13.101.17:3000

## Quick Start

```bash
# Clone
git clone https://github.com/Heldinhow/prompt-enhancement-engine
cd prompt-enhancement-engine/frontend

# Install
npm install

# Configure API Key
echo "MINIMAX_API_KEY=your_key" > .env.local

# Run
npm run dev
```

Visit `http://localhost:3000`

## API

```bash
curl -X POST http://localhost:3000/api/enhance \
  -H "Content-Type: application/json" \
  -d '{"input": "crie uma api", "mode": "coding"}'
```

## Response Format

```json
{
  "optimized_prompt": "...",
  "improvements_applied": ["...", "..."],
  "score": {
    "clarity": 9.0,
    "specificity": 8.5,
    "executability": 9.0,
    "ambiguity_control": 8.0,
    "structure": 9.0,
    "final_score": 8.7
  },
  "compact_version": "..."
}
```

## Tech Stack

- **Frontend:** Next.js 16 + TailwindCSS
- **API:** Next.js API Routes
- **AI:** MiniMax M2.5

## License

MIT
