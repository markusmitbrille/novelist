Saving/Auto-saving fixes:

- auto-saving (and probably saving) sometimes change the caret position (to the start?) while writing
- this is unacceptable, saving and auto-saving should never interfere with writing

Search/replace panel fixes:

- search and replace dialog text fields should have more rounded edges to harmonize better with the shape of panel surrounding them
- pressing enter while the search text box is active should go to the next match (same as pressing next match button)
- match count label ("[x] of [n]") in search and replace panels should be padded better to the left and right so the panel doesn't look so cramped
- entire search/replace panel should be moved slightly so it sits just inside the editor page borders, without touching them
- ctrl-g shortcut should also open the find panel, but this shortcut should not be displayed inside the edit menu

Typewrite mode:

- not working as intended
- review current implementation
- the intended design is fore the caret to remain roughly in the middle of the editor page while typing
- if that is not possible via CodeMirror functions, do not try to implement by manually scrolling the viewport, but rather remove the feature entirely (including settings entry, db stuff, and related code)