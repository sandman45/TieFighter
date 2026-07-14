// Manifest of selectable pilot portraits. `type: 'icon'` renders the shared
// inline SVG bust with a CSS color variant (no image asset). `type: 'photo'`
// renders an <img src>. To add a real cropped photo later: drop the file in
// webGL/images/pilots/ and add a `{ id, type: 'photo', src }` entry here —
// no other code changes needed, PilotScreen.js renders whatever this list contains.
export default [
    { id: "tie-pilot-standard", type: "icon", variant: "standard" },
    { id: "tie-pilot-amber",    type: "icon", variant: "amber" },
    { id: "tie-pilot-red",      type: "icon", variant: "red" },
];
