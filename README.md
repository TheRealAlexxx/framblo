# Framblo

**Build visually. Own your code.**

Framblo is a free, open-source, local-first visual website builder. Start on a project dashboard, choose a template, edit sections visually and export portable HTML/CSS/JavaScript. No account or subscription is required for editing.

**Live editor:** https://framblo.vercel.app

## Features

- Dashboard with saved projects, getting-started information, and templates.
- Visual responsive editor with sections, layers, page management, styling and assets.
- Local browser storage: download project backups because clearing browser data deletes saved work.
- Portable website ZIPs containing HTML, CSS, JavaScript and uploaded image assets.
- Optional **Connect GitHub** publishing; **no personal access token fields**.

## GitHub publishing

Framblo uses a GitHub App and server-side OAuth authorization. Users authorize Framblo, choose a repository where the app is installed, and publish an exported snapshot to a new `framblo-...` branch. If permitted, Framblo offers to enable GitHub Pages, leaving unrelated sites untouched.

To enable this feature, register a GitHub App with:
- Homepage: `https://framblo.vercel.app`
- Authorization callback: `https://framblo.vercel.app/api/github/callback`
- Repository permissions: **Contents: Read and write**, **Metadata: Read-only**, **Pages: Read and write** (for Pages automation)
- Expiring user authorization tokens enabled; no webhook needed
- Installation availability: Any account

In Vercel production environment variables, configure:
- `GITHUB_CLIENT_ID`: the GitHub App's client ID
- `GITHUB_CLIENT_SECRET`: secret
- `FRAMBLO_SESSION_SECRET`: an independent cryptographically random secret of at least 32 characters
- `GITHUB_APP_SLUG`: your GitHub App slug (recommended)
- `FRAMBLO_PUBLIC_URL`: `https://framblo.vercel.app` (recommended)

Never commit private keys or client secrets. A separate GitHub App keypair is not used by the current user-authorization backend. Test the complete authorization/publish flow using a disposable repository before relying on it.

## Deployment

The `dist/index.html` file is a standalone compiled editor, served directly by Vercel. The six `api/github/*` serverless endpoints implement login, callback, session, repository selection, publishing and disconnect. `lib/github.js` supplies encrypted sessions and GitHub API helpers. `vercel.json` selects the `dist` output directory. Vercel deploys commits to `main` automatically.

**Source note:** This GitHub release currently contains the built and editable HTML/JS/CSS editor plus its server-side source. The separate modular editor source and automated tests are available in the Framblo v1 source ZIP produced during development and are pending import into the repository.

## Privacy and limitations

Editing needs no login. Projects stay in this browser's IndexedDB, not in a Framblo cloud account. GitHub authentication uses a secure HttpOnly encrypted browser cookie; tokens are never requested from users as text or embedded in exported websites. Publishing has not yet been validated end-to-end with a real visitor account on this new release.

## Licence

MIT — see [LICENSE](LICENSE).
