# bondarewicz.com

Łukasz Bondarewicz's personal site. Instead of a CV, visitors ask questions and an agent answers from his profile and GitHub, set like a printed interview. Below the conversation: what he's building and a short career timeline. The agent and its data live in the API, [`bondarewicz/api`](https://github.com/bondarewicz/api).

## Run locally

```sh
npm install
npm run dev          # http://localhost:5174
```

The site calls the API at `VITE_API_BASE` (`.env.development` points it at `http://localhost:8080/v1`; production builds use `https://api.bondarewicz.com/v1`). Start the API locally first, see its README. Without it, the site still renders and the agent shows as offline.

To share the dev server through ngrok, run `NGROK=1 npm run dev` so live reload works over HTTPS.

## Build and deploy

```sh
npm run build        # outputs dist/
```

Every push to `master` builds and publishes to GitHub Pages with the workflow in `.github/workflows/deploy.yml`; `public/CNAME` serves it at bondarewicz.com. Pushes in quick succession cancel the earlier deploy, so the last one wins.

## Structure

| File | What it does |
|---|---|
| `src/App.jsx` | The page: header, the question box that doubles as the headline, what I'm building, career, footer |
| `src/Agent.jsx` | Conversation state and the interview-style thread: questions, answers, sources, fit reports for job descriptions, follow-up suggestions, contact details form |
| `src/site.css` | All styles. Night navy for the conversation, paper for reading, teal for interaction, amber for the one primary action |
| `src/profile.json` | Copy of `api/agent/profile.json`; renders the projects and timeline. Keep it in sync when the profile changes |
| `index.html` | Title, description, social preview tags and fonts (Instrument Serif, Geist) |

## Behaviour worth knowing

- A conversation lives in the visitor's tab (sessionStorage) and survives a refresh; the API also records it, with a conversation id, so Łukasz can follow up.
- Clicking a source scrolls to and highlights the matching section.
- "Ask for a walkthrough" scrolls up to the conversation and asks there.
- Typed example questions are no longer than the headline, so they never wrap onto a second line.
- Motion is limited to the headline typing and the online indicator, and stops for visitors with reduced motion turned on.
