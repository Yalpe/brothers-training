# Brothers Hockey Training

10-week summer training program for G (goalie, ~10) and S (skater, 12).

## Installing on Android

1. Open the app URL in Chrome on Android
2. Tap the three-dot menu (⋮) → **"Add to Home Screen"** or **"Install app"**
3. Tap **Add** — the icon appears on your home screen
4. Launch it like any other app — it works fully offline

## Using the app

- **Today** — Pick your current session (stored, so you don't re-pick every time). Tap exercises for form cues. Check off as you go. Tap the timer after each superset for the rest countdown.
- **Browse** — Preview any session from the full program.
- **Tests** — Log G and S results on test days (last session of each phase). The app tracks percent improvement per athlete.
- **Rules** — House rules and the full games menu for reference.

## Updating content

Edit `program-data.json` and push to GitHub. The app will update automatically next time it's opened with internet access.

## Local development

```
npx serve .
```

Then open `http://localhost:3000` in Chrome. ES modules require a server (not `file://`).
