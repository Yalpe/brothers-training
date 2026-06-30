# Brothers Hockey Training — CLAUDE.md

Mobile-first PWA for a 10-week summer hockey program. Two athletes: G (goalie ~10yo) and S (skater 12yo). Deployed to GitHub Pages. No build step — plain HTML/CSS/ES modules served directly.

## Tech

- No framework, no npm, no build. Files are served as-is by GitHub Pages.
- ES modules via `<script type="module">`. Single `fetch('program-data.json')` on load.
- Hash-based router: `#today`, `#browse`, `#tests`, `#reference`.
- All persistence via `localStorage` with `bht_` key prefix.
- Service worker (`sw.js`) — cache-first, offline-first. Bump `CACHE = 'bht-vN'` on every deploy that changes cached assets.

## File structure

```
index.html          app shell + bottom nav
manifest.json       PWA manifest
sw.js               service worker (cache-first, Promise.allSettled so missing icons don't abort)
program-data.json   ALL content — the single source of truth
icons/              icon.svg, icon-192.png, icon-512.png, icon-maskable.svg
src/
  app.js            boot, router, localStorage helpers
  styles.css        mobile-first, navy/ice-blue/gold palette
  views/
    today.js        session picker + session runner (primary view)
    browse.js       read-only session list + preview
    tests.js        test logging + improvement tracking
    reference.js    house rules accordion
```

## program-data.json — critical constraints

These fields are used as lookup keys or parsed by regex — do NOT change their format:

- **Exercise names** (English) — keys into `formData`. Must match exactly across `weeks[].blocks[].items[].exercises[].name` and `formData`.
- **Test names** — must match exactly: `"Saut en longueur debout"`, `"Navette 5-10-5"`, `"Équilibre sur une jambe, yeux fermés"`, `"Maintien squat profond"`, `"Réceptions balle contre mur"`, `"Déplacements latéraux"`. `LOWER_IS_BETTER` set in tests.js uses `"Navette 5-10-5"` literally.
- **`rest` strings** — must contain `"sec"` or `"min"`. Parsed by `/(\d+)\s*sec/i` and `/(\d+)\s*min/i` in today.js.
- **G/S spec strings** — split on `" / "` (space-slash-space) for two-column display. e.g. `"G 3×8 @10lb / S 3×8 @15-20lb"`.
- **`loc` values** — only `"field"` or `"basement"`.

## Language

All UI text and `program-data.json` content is **Quebec French**. Use natural conversational tone:
- Prefer "on" constructions over passive voice
- "c'est" phrasing, short coaching sentences
- Direct parent-to-kids tone

## Deployment

Push to `main` → GitHub Pages auto-deploys. Always bump `bht-vN` in sw.js when changing any cached file so users get the update.

Local dev: `npx serve .` then open `http://localhost:3000` (ES modules need a server, not `file://`).

## Session design principle

In practice it's easier and faster for all three participants (G, S, and Papa) to do the same exercises together. Prefer `solo` blocks where everyone does the same thing over `split` blocks with position-specific exercises, unless there's a strong reason to differentiate.

## Key behaviors

- **Compound exercise search links**: `cuesHTML()` in today.js splits exercise names on `" + "` and generates one Google search link per component.
- **Rest timer**: `parseRestSeconds()` regex in today.js — rest strings must keep "sec"/"min".
- **Checkboxes** persist per `done_{weekIndex}_{exerciseName}` key in localStorage.
- **Session selection** persists as `{ weekIndex }` in localStorage under key `session`.
- **Test results** stored as array of `{ date, G: {...}, S: {...} }` in localStorage.
- **SW install**: uses `Promise.allSettled` so a missing PNG won't abort the whole install.
