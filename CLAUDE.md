# Hawaii Urban Village - Claude Handoff

Project owner: the.o
Client: Comunica Group / Hawaii Pescara

## Read First

Before editing, read:

- `docs/claude-code-design-handoff.md`
- `docs/codex-return-audit-brief.md`
- `docs/hawaii-urban-village-masterplan-2026.md`
- `docs/hawaii-content-handoff-2026.md`
- `web/AGENTS.md`

## Current Goal

Complete the premium Hawaii Pescara "Urban Village" web experience.

The main creative task is to replace provisional media with the definitive video, poster frames, imagery, motion details, and graphics while preserving the current architecture:

- Next.js app in `web/`
- Sanity Studio scaffold in `studio/`
- Content model in `web/src/lib/site-content.ts`
- Scroll-controlled homepage video stage in `web/src/components/home/scroll-video-stage.tsx`
- SEO/entity landing pages under `web/src/app/`

## Non-Negotiables

- Do not expose secrets or API keys in client code.
- Do not commit credentials, `.env`, `.next`, `node_modules`, Sanity build output, generated screenshots, or temporary render files.
- Keep the homepage immersive, minimal, visual-first, and mobile-priority.
- Do not turn the site back into a classic block-based WordPress-like homepage.
- Do not add heavy WebGL or Three.js unless explicitly requested and justified by a measurable visual gain.
- Keep the text about Hawaii, not about the interface.
- Keep landing pages HTML-first and indexable.
- Preserve `prefers-reduced-motion` behavior.
- Preserve or improve the existing Playwright smoke coverage.

## Commands

From project root:

```bash
npm install
npm --prefix web install
npm run test:web:smoke
npm --prefix web run lint
npm --prefix web run build
```

Preview:

```bash
npm --prefix web run start -- --hostname 127.0.0.1 --port 3000
```

## Collaboration Contract

Claude should implement the definitive media/motion pass and leave a clear changelog for Codex.

When handing back to Codex, provide:

- GitHub repository URL
- branch or PR URL
- summary of changed files
- final media inventory
- verification commands and results
- known risks or incomplete items

Codex will then perform an audit focused on behavior, performance, SEO, accessibility, security, and repository hygiene.
