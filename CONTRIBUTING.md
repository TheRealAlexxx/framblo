# Contributing to Framblo

Thanks for helping. Framblo is a small project, so a quick fix is as welcome as a big feature.

## Ways to help

- Try the app at https://framblo.vercel.app and open an issue if something feels off.
- Suggest a new section, template or theme.
- Fix a bug or improve copy, accessibility or speed.

## Set up

Node.js 20 or later. No packages are needed for the app itself.

```sh
npm run build
python -m http.server 4173 --directory dist
```

Then open http://localhost:4173. Run `npm test` before you open a pull request.

## Pull requests

- Keep each pull request small and about one thing.
- Say what changed and why in plain words.
- Add a screenshot for anything visual.
- Exports must stay plain HTML, CSS and JavaScript. Nothing in an exported site should depend on Framblo.

## Licence

By contributing you agree that your work is released under the MIT licence.
