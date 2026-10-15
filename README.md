# Framblo

**A visual website builder. Your site, your code.**

[Open Framblo](https://framblo.vercel.app/) · [Source](https://github.com/TheRealAlexxx/framblo) · [MIT licence](LICENSE)

Start on the homepage, preview an actual starter website, and open the editor. Change sections, text, images and theme settings. Export ordinary HTML, CSS, JavaScript and assets, or connect GitHub to publish.

## Interface

The interface uses a restrained ink-and-pink visual system, real website previews and a project workspace. The editor shares its navigation, typography and control styles with the homepage. There are no font CDN calls, required accounts or extra runtime dependencies for editing.

Projects stay in this browser's IndexedDB. Changing devices or clearing site data does not move your work with you. Keep JSON backups. Existing OpenCanvas/Framblo projects and the original local database are preserved.

## Build and test

Node.js 20 or later; no packages needed for the production app.

```sh
npm run build
npm test
python -m http.server 4173 --directory dist
```

Open http://localhost:4173. The build writes a self-contained `dist/index.html`, including styles and scripts, so it can also be opened directly. Serving localhost is preferable for reliable storage.

### Source map

- `src/editor.base.html`: the existing standalone editor engine, project model, render/export code, and storage implementation.
- `ui/home.html`: semantic homepage and workspace markup.
- `ui/framblo.css`: interface design system and responsive layouts. Does not affect exported websites.
- `ui/enhance.js`: sandboxed real template previews and saved-project presentation.
- `scripts/build.mjs`: deterministic assembly with checked replacement boundaries and JavaScript parsing.
- `tests/design.test.mjs`: compatibility/build invariants.
- `tests/browser.mjs`: real Chromium workflow checks, responsive measurements, exports, and IndexedDB persistence.
- `api/github/` and `lib/github.js`: existing GitHub App user-authorization backend.

Browser tests install a pinned Playwright version into `.qa/`, separate from the application. GitHub Actions runs the checks and stores screenshots as a short-lived artifact. To run locally:

```sh
npm install --prefix .qa --no-audit --no-fund --save-exact playwright@1.63.0
node .qa/node_modules/playwright/cli.js install --with-deps chromium
npm run build
npm run test:browser
```

`dist/` is generated rather than committed. The original editor is preserved as source; the larger modular development archive from the first build has not yet been imported. Do not mistake the new UI test suite for a full security or cross-browser audit.

## GitHub publishing

Users authorize the Framblo GitHub App, choose an installed repository, and publish to a new `framblo-...` branch. No personal-access-token input is required. The UI redesign does not change the publishing backend or its credentials.

Maintainer setup:

- GitHub App homepage: `https://framblo.vercel.app`
- Callback: `https://framblo.vercel.app/api/github/callback`
- Repository permissions: Contents read/write, Metadata read-only; Pages read/write for Pages setup.
- Expiring user authorization tokens; installable on any account; no webhook required.
- Vercel production variables: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `FRAMBLO_SESSION_SECRET`, `GITHUB_APP_SLUG`, `FRAMBLO_PUBLIC_URL`.

Keep secrets out of GitHub and browser code. Session and client secrets belong only in Vercel's server-side secret variables. Editing/export works without GitHub configuration. The static local test server does not provide OAuth endpoints; the browser test mocks only the unconfigured-session response. A real OAuth/publish test still requires a consenting GitHub user and a test repository.

## Deployment

Vercel builds commits using `npm run build`, serves `dist`, and runs `api/github` as Node.js functions. Preview branches are for design checks; `main` is production. Existing GitHub App variables and application data must remain unchanged during interface updates.

## Licence

MIT. You are responsible for the content and images in websites you publish.
