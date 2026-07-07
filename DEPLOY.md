# Foundry

E-commerce platform — deploy to Netlify + Neon.

## Deploy (Netlify + GitHub)

1. Push this repo to GitHub
2. Netlify → **Add new site** → **Import an existing project** → **GitHub**
3. Select this repository
4. Build settings (auto-detected from `netlify.toml`):
   - Build command: `npm run build:netlify`
   - Plugin: `@netlify/plugin-nextjs`
5. **Environment variables** → Import `netlify-env.import` (run `npm run export:netlify-env` locally)
6. Deploy

See `docs/LAUNCH.md` for the full checklist.
