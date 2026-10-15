# Framblo

**Build visually. Own your code.**

Framblo is a free, local-first visual website builder. Start with a template, edit directly on the canvas, arrange sections, preview real device widths, and export ordinary HTML, CSS, JavaScript and images. No account, subscription, AI credits, build system or Framblo hosting required for your exported website.

![The Framblo editor](docs/editor.png)

## Try it

Open `dist/index.html` in a modern browser. For the most reliable local project storage, serve the app on localhost instead of opening a `file://` URL:

```sh
npm run dev
```

Visit `http://localhost:4173`. Node.js 20 or later is required for this command. There are no packages to install. The prebuilt editor and the exported websites do not require Node.js.

## Using the editor

1. Start with Studio, Product, Portfolio, or a blank canvas through the project menu.
2. Click a section to select it. Double-click text to edit it in place, or use the right inspector.
3. Add sections from the library. Reorder them in Layers by dragging or with the move controls. Duplicate and delete sections freely; Undo and Redo restore changes.
4. Use Theme for site-wide colours, typography, width and rounded corners. Use section Style for background, spacing and alignment.
5. Upload your own images in Assets. Choose desktop, tablet or mobile above the canvas, then use Preview to test links, page navigation and accordions.
6. Export a website ZIP or a single HTML page. Back up the editable project as JSON so you can import it later.

Twelve section types are included: navigation, hero, features, text, image, gallery, highlights, quote, FAQ, call to action, contact and footer. The editor supports multiple pages, page titles, descriptions and filenames.

### Your data

Projects and uploaded images stay in this browser's IndexedDB. There is no cloud account or cross-device sync. Clearing site data, private browsing, changing the app's origin, or browser storage eviction may remove your saved work. **Keep project JSON backups.** If browser storage is unavailable, the editor warns you instead of claiming the project was saved.

Raster image uploads are resized locally to a maximum of 1600 pixels and encoded as WebP. Uploads accept PNG, JPEG and WebP, with a 10 MB input limit and a 65-megapixel safety limit. Projects can contain up to 80 images / 20 MB of embedded assets. External image URLs remain external: they need a connection and depend on the original host. Upload images for portable exports.

### What the export contains

- One ordinary `.html` file per page, plus `styles.css` and `script.js`.
- Uploaded images in `assets/`.
- `.nojekyll`, hosting notes, and `framblo.project.json` for further editing.
- No editor runtime or required Framblo service.

The contact section creates an email draft in the visitor's email application. It is not a hosted form inbox and does not send mail by itself. Set the recipient in the inspector.

## Publish to GitHub

The alpha publisher sends an exported snapshot directly from your browser to the GitHub API. It uses a fine-grained personal access token, **not OAuth sign-in**.

1. Create a repository in GitHub with an initial README/commit.
2. Create a short-lived fine-grained token limited to that repository, with **Contents: Read and write** permission. Organisation policy may require approval.
3. In Framblo, select **Publish to GitHub** and enter the token plus `owner/repository`. Review and accept the new-branch action.
4. Framblo creates a new `framblo-...` branch containing your exported website. It does not change or delete existing branches.
5. To host through GitHub Pages, select that new branch and the root folder in the repository's Pages settings. Availability and visibility depend on your repository and GitHub account settings. For later releases, select the newly generated branch again.

The token is never put in project data, backups, exported code, or browser storage. It is cleared from the dialog when closed or submitted. Requests go directly to `https://api.github.com`. Never post a token in a chat or issue. Use a limited, expiring token and revoke it after publishing. Do not paste credentials into a modified or untrusted copy of this app.

**Live authenticated publishing has not been tested against an actual account in this build.** Request sequences and error handling are covered with mocked GitHub responses. Token scopes, branch permissions, organisation policies and Pages configuration still need a real-account release check.

## Development

```sh
npm run build   # Compile readable src/ files into a dependency-free dist/index.html
npm start       # Serve the compiled editor on localhost:4173
npm test        # Run Node's built-in test runner
```

The production app uses native browser APIs, not a bundled third-party editor. Source responsibilities:

| File | Purpose |
| --- | --- |
| `src/model.js` | Versioned project model, templates, validation, history |
| `src/render.js` | Shared site renderer and isolated editing bridge |
| `src/site.css` | Responsive styles for exported sites |
| `src/export.js` | ZIP generation, portable export, GitHub publishing |
| `src/storage.js` | IndexedDB persistence |
| `src/app.js` | Editor state and controls |
| `src/editor.css` / `src/shell.html` | Workspace interface |

To add a section, update its definition/default fields in the model, its renderer, and the corresponding site styles. Add tests before expanding the import schema. Framblo projects use schema version 1. Existing OpenCanvas v1 JSON projects are accepted and upgraded on import. The legacy IndexedDB database name is intentionally preserved so previously saved projects remain accessible on the same browser origin. A new domain or a new local file origin will not share browser storage: export a backup from the old origin and import it into Framblo.

### Browser tests

`tests/browser.test.py` uses Python Playwright and Chromium. Install those test tools separately, then set `CHROMIUM_PATH` to your Chromium executable and run the script. They are not production dependencies. Screenshots and temporary export fixtures are written to `/mnt/data` in the original test environment; adjust the test output paths for your own machine.

The supplied report records **31 Chromium interaction checks** and the Node suite contains **12 tests**. The browser environment blocked navigation to local and remote URLs, so the suite used `set_content` and a test-only in-memory storage adapter. The production storage module is unchanged. Real IndexedDB persistence across browser sessions, live authenticated GitHub publishing, Safari and Firefox still require release validation. This is a working alpha, not a claim of production security certification.

### Current boundaries

This release is a responsive section-based builder, not an arbitrary free-positioning design tool. It does not import arbitrary third-party HTML back into editable sections. No AI generation, OAuth, server-side forms, payment handling, cloud collaboration or theme marketplace is included. You can edit exported code independently; use the project JSON to continue in the visual editor.

## Hosting the editor

Serve `dist/` on any static host. For Vercel, this repository includes `vercel.json`: the build is `npm run build`, output directory `dist`, framework preset Other. No environment variables are required.

## Contributing

Report the browser, reproducible steps and a minimal project JSON when possible. Remove private text, personal images and email addresses from examples. Never include tokens. Small focused improvements and regression tests are welcome. This source archive is ready for a repository; it has not automatically been pushed into a GitHub repository.

## License

MIT. See [LICENSE](LICENSE). Original default visual illustrations are made with CSS. The starter copy is demonstration content, not customer endorsements or measured business results. You are responsible for the rights to any images or content you add.