<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Elleboro

- Non interrogare tabelle private dalle route pubbliche.
- Preferenze, specifiche, note e appuntamenti solo nelle route del proprietario.
- Il feed calendario non include note né preferenze.
- Il logo si cambia solo da `src/components/brand/Logo.tsx` e `public/brand/logo.jpg`.
- Testi in italiano, senza trattino lungo.
- Una foto cliente entra nel bucket pubblico solo con il gesto di pubblicazione.
- Le testimonianze non si collegano al fascicolo e non si inventano.
- Non scrivere ref, chiavi, path locali, token del feed o email vere nei file tracciati da Git.
- Ogni comportamento nuovo parte da un test rosso.
