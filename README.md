# bondarewicz.com

Łukasz Bondarewicz's personal site: a short introduction, what he does, and an assistant visitors can ask anything about his work. The assistant and its data live in the API, [`bondarewicz/api`](https://github.com/bondarewicz/api).

## Run locally

```sh
npm install
npm run dev          # http://localhost:5174
```

The site calls the API at `VITE_API_BASE` (`.env.development` points it at `http://localhost:8080/v1`; production builds use `https://api.bondarewicz.com/v1`). Start the API locally first, see its README. Without it, the page still renders and the assistant shows as offline.

To share the dev server through ngrok, run `NGROK=1 npm run dev` so live reload works over HTTPS.

## Profile

`src/profile.json` is generated from the API's `agent/profile.json`. After changing the profile there, run:

```sh
npm run sync-profile
```

It copies only what the page shows, the capabilities and the GitHub and LinkedIn links, so nothing else from the profile (employers, dates, projects) ends up in the site's code.

## Build and deploy

```sh
npm run build        # dist/, pre-rendered
```

The build renders the page to static HTML (`src/entry-server.jsx`, `scripts/prerender.mjs`) so search engines and link previews see the full content; React then takes over in the browser (`src/main.jsx`).

Every push to `master` builds and publishes to GitHub Pages with `.github/workflows/deploy.yml`; `public/CNAME` serves it at bondarewicz.com. Pushes in quick succession cancel the earlier deploy, so the last one wins.

## Structure

| File | What it does |
|---|---|
| `src/App.jsx` | The page: header with the wordmark, hero (greeting, headline, what I do, Ask me anything), About me, What I do, footer |
| `src/Agent.jsx` | Conversation state, the question box, and the full-screen conversation view: answers labelled "My assistant", sources, fit reports for job descriptions, follow-ups, the contact form when it's needed |
| `src/site.css` | All styles. Night navy for the hero and conversation, paper for reading, teal for interaction, amber for the one primary action |
| `src/profile.json` | Capabilities and links, copied from the agent's profile (see "Profile") |
| `index.html` | Title, description, canonical URL, social preview tags, structured data (schema.org Person), fonts (Instrument Serif, Geist) |
| `public/` | `og.png` social preview, favicons, `robots.txt`, `sitemap.xml`, `CNAME` |

## Behaviour worth knowing

- Asking anything opens a full-screen conversation with the question box pinned to the bottom; closing it (✕ or Esc) returns to the page, which offers to continue.
- A conversation lives in the visitor's tab (sessionStorage) and survives a refresh; the API also records it, so Łukasz can follow up.
- The page is in Łukasz's voice; the assistant's answers are labelled "My assistant" and talk about him in the third person.
- Motion is limited to the question box typing example questions and the online indicator, and stops for visitors with reduced motion turned on.
