# Deploy ClipForge

## Model & env (required for live AI)

- **Default model:** `kimi-k3:cloud` (~2.81T params — trillion-class on Ollama Cloud)
- **Alternates:** `deepseek-v4-flash:cloud`, `kimi-k2.6:cloud` (set via `OLLAMA_MODEL`)
- **Host:** `https://ollama.com` (`OLLAMA_HOST`)
- **Auth:** `OLLAMA_API_KEY` Bearer token — create at https://ollama.com/settings/keys
- Allowed cloud names from `ollama ls`: kimi-k3:cloud, kimi-k2.6:cloud, kimi-k2.7-code:cloud, minimax-m3:cloud, deepseek-v4-flash:cloud, glm-5.3:cloud

Set these in Netlify → Site configuration → Environment variables. Never commit secrets.

Without the key, the app still deploys and runs **mock** generation with an on-page banner.

## Prerequisites

- Node 20+
- GitHub repo: `Thundernight1/clipforge`
- Live site: https://clipforge-tn1.netlify.app

## Deploy (static + functions)

```bash
cd /workspace/clipforge
npm install
npm run build
npx netlify deploy --prod --dir=out --functions=netlify/functions
```

Build settings: command `npm run build`, publish `out`, Node 20.
Env: `OLLAMA_API_KEY`, `OLLAMA_HOST=https://ollama.com`, `OLLAMA_MODEL=kimi-k3:cloud`
