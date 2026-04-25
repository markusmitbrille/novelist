# Stable Architectural Memory

This file records durable project truth for Novelist.

## Project Identity

- Project name: `novelist`
- Product name: Novelist
- Target host: GitHub Pages from `docs/index.html`
- Target browsers: Chromium-based browsers with the File System Access API

## Product Shape

Novelist is a source-only markdown editor that works directly with local files.

Current scope:

- one active markdown document at a time
- native Open, Save, and Save As through `showOpenFilePicker` and `showSaveFilePicker`
- autosave writes back to the opened file after permission is granted
- no fallback import/download workflow for unsupported browsers
- unsupported browsers show a Chromium requirement message
- CodeMirror 6 editing, markdown formatting commands, find/replace, editor settings, status, word count, and caret metadata

Out of scope:

- multi-document workspaces
- browser-local document databases
- rendered markdown preview
- generated text features
- external host adapters
- book export flows

## Architecture

Active implementation surface:

- `src/main.tsx`
  - installs head assets and mounts the React app
- `src/App.tsx`
  - owns the active file session, File System Access API flows, autosave, menus, search, dialogs, and status
- `src/editor.js`
  - owns CodeMirror setup, markdown formatting commands, search decorations, and editor operations
- `src/constants.js`
  - app metadata, shortcuts, fonts, themes, and defaults
- `src/styles.js`
  - single stylesheet source for the static app
- `src/react/`
  - small Material Web wrappers, tooltip, toolbar, search popup, theme helpers, shared types, and UI utilities
- `scripts/build.js`
  - bundles the app and writes `docs/index.html`
- `scripts/serve.js`
  - serves `docs/index.html` for local preview and browser tests

The app is a static site. The committed Pages artifact is `docs/index.html`; the build must preserve any other files in `docs/`.

## File Workflow

Open:

- use `window.showOpenFilePicker`
- accept `.md`, `.markdown`, and `.txt`
- retain the returned file handle for future saves
- derive the title from the file name

Save:

- if a handle exists, request or confirm read/write permission and write to the same file
- if no handle exists, route through Save As

Save As:

- use `window.showSaveFilePicker`
- retain the new handle
- write the current editor text to that file

Autosave:

- debounce editor changes
- write only when a file handle exists
- untitled documents remain dirty until Save As

## Testing

Current verification commands:

- `npm run build`
- `npm run typecheck`
- `npm run test`
- `npm run test:gui`
- `npm run check`

Current test coverage focuses on:

- CodeMirror markdown formatting
- mocked File System Access open/save/save-as/autosave flows
- unsupported-browser rendering
- Chromium smoke coverage for opening, editing, saving, and find/replace
