# Novelist

Novelist is a local markdown editor for Chromium-based browsers. It is designed to run as a static GitHub Pages web app while editing files directly on your device through the File System Access API.

## Features

- Source-only markdown editing powered by CodeMirror 6
- Native `Open`, `Save`, and `Save As` flows for local `.md`, `.markdown`, and `.txt` files
- Autosave back into the opened file after write permission is granted
- Markdown formatting toolbar
- Find and replace
- Editor themes, font selection, font size, and current-line highlighting
- Live caret position, line/column, word count, dirty state, and save status

Novelist targets Chromium-based browsers such as Chrome and Edge. Unsupported browsers show a clear warning instead of offering an alternate file workflow.

## Development

Install dependencies once:

```powershell
npm install
```

Build the GitHub Pages artifact:

```powershell
npm run build
```

Start the local preview server:

```powershell
npm run serve
```

Then open:

- [http://localhost:4173/docs/index.html](http://localhost:4173/docs/index.html)

## GitHub Pages

The build writes the static app to:

- `docs/index.html`
- `docs/assets/novelist-*.js`

Configure GitHub Pages to serve from the default branch's `/docs` folder. The build preserves other files in `docs/` and only refreshes generated files under `docs/assets/`.

## Testing

```powershell
npm run typecheck
npm run test
npm run test:gui
npm run check
```

`npm run check` builds the app, runs TypeScript checking, runs Vitest, and then runs the Chromium Playwright suite.
