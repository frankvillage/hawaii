# Codex Return Audit Brief

Use this document when the project returns from Claude Code / Claude Design.

## Required Input From Claude

- GitHub repository URL
- branch or PR URL
- commit range
- changed-files summary
- final media list with file sizes
- commands run and results
- screenshots or recording of desktop and mobile homepage
- notes on anything unfinished

## Audit Scope

Codex should audit the work in this order:

1. Repository hygiene
2. Install/build reliability
3. Homepage video scroll behavior
4. Mobile layout and interaction
5. Media performance
6. Accessibility and reduced motion
7. SEO and structured data
8. Forms, rate limiting, privacy, and secret handling
9. Content correctness and brand consistency
10. Deployment readiness

## Baseline Commands

```bash
npm install
npm --prefix web install
npm --prefix web run lint
npm --prefix web run build
npm run test:web:smoke
```

If Claude adds Studio work:

```bash
npm --prefix studio install
npm --prefix studio run build
```

## Homepage Behavior Checks

Verify:

- `journey-video` exists once.
- Scrolling advances and reverses `video.currentTime`.
- Hotspots remain tappable and do not cover critical visual content.
- Scene labels do not describe the interface.
- Soul rail remains minimal.
- Mobile first viewport is usable.
- Reduced motion does not depend on video scrubbing.
- No autoplay sound.
- No scroll hijacking.

## Performance Checks

Verify:

- Poster appears before video metadata.
- Video file sizes are reasonable.
- Mobile is not forced to download oversized desktop media if a mobile version exists.
- Only one master video loads on the first experience.
- No large generated output or source exports are accidentally shipped.

## SEO Checks

Verify:

- Entity pages remain crawlable HTML.
- `sitemap.ts` and `robots.ts` are correct.
- Structured data is still valid.
- FAQ schema remains present.
- Video and image alt text reflect final media.
- Core service content is not trapped only in video.

## Security And Privacy Checks

Verify:

- No secrets in client code or repository.
- New env vars are documented in `web/.env.example`.
- Form routes validate with Zod.
- Honeypot and rate limiting still work.
- Cookie consent remains non-invasive and consent-aware.
- No analytics or tracking added without consent handling.

## Expected Audit Output

Codex should return:

- blocking issues
- non-blocking recommendations
- verification evidence
- files reviewed
- production readiness verdict
