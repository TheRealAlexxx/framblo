# Framblo

**Build visually. Own your code.**

Framblo is a free, local-first visual website builder. Start with a template, edit directly on the canvas, preview layouts at different screen widths, and export ordinary HTML, CSS, JavaScript, and images. No Framblo account or subscription required.

## Try the alpha

1. [Download the prebuilt editor](https://github.com/TheRealAlexxx/framblo/raw/refs/heads/main/dist/index.html).
2. Open `index.html` in a modern desktop browser.
3. For more reliable browser storage, serve the file from localhost instead of opening it as `file://`:

```sh
python -m http.server 4173 --directory dist
```

Then visit http://localhost:4173.

## Features

- Visual section editing, inline text editing, and rearranging sections.
- Four starter templates and a blank canvas.
- Responsive desktop, tablet, and phone previews.
- Undo/redo and local browser project storage.
- Import/export of Framblo project backups (including legacy OpenCanvas backups).
- Portable static website export with assets.
- An optional GitHub publish workflow using a user's own GitHub credentials.

## Deployment

The checked-in alpha is a **static app** at `dist/index.html`. `vercel.json` sets `dist` as the output directory. In Vercel, import this GitHub repository and deploy with **Framework Preset: Other**. No build/install command or environment variables are needed for this prebuilt alpha.

## Development status

**0.1.0 alpha.** The repository currently contains the bundled browser editor, the licence, and deployment configuration. The modular development source and test suite from the source archive are not yet checked into this repository. The built HTML contains the editor's client-side JavaScript and CSS, but is less convenient to modify than the modular sources.

The development source archive was validated locally with 13 passing unit/integration tests and 31 browser interaction checks. These checks do not guarantee Safari/Firefox compatibility or long-term browser storage, so keep your editable project backups.

## Licence

MIT. See [LICENSE](LICENSE).
