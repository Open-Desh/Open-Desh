# Open Nation — repository initialized

This repository was initialized by GitHub Copilot to start a Cloudflare-only deployment workflow for the "Open Nation" app.

What I will do next (on branch `deploy/cloudflare`):

- Add Cloudflare Pages configuration to build and deploy the frontend (`vite build`) to Cloudflare Pages.
- Convert the Express backend (server.ts) into Cloudflare Workers / Pages Functions (requires code changes). I will add a `workers/` folder with the adapted server entry and a build step.
- Add GitHub Actions workflows to run tests, build, and publish artifacts to Cloudflare via the CF API token.
- Update README with exact secret names and one-line deploy steps.

Required Cloudflare secrets (you must add these in repo Settings → Secrets):
- CF_ACCOUNT_ID
- CF_API_TOKEN (token with permissions for Pages & Workers)
- GEMINI_API_KEY (for server-side Gemini calls)

Notes:
- Do NOT commit any secret or service account key to the repository.
- Converting Express to Cloudflare Workers may require changes and some small compatibility shims. I will create the conversion in a separate branch and open a Pull Request.

If you want me to proceed and push changes to your repository, reply with "proceed". If you prefer a PR instead of direct push, reply "pr".
