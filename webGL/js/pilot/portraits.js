// Manifest of selectable pilot portraits. `type: 'icon'` renders the shared
// inline SVG bust with a CSS color variant (no image asset). `type: 'photo'`
// renders a real TIE pilot headshot photo; `position`/`size` are the CSS
// background-position/background-size used to crop in on the helmet.
export default [
    { id: "tie-pilot-1", type: "photo", src: "./images/impirials/tie-pilot-1.jpg", position: "50% 6%",  size: "145% auto" },
    { id: "tie-pilot-2", type: "photo", src: "./images/impirials/tie-pilot-2.jpg", position: "50% 8%",  size: "165% auto" },
    { id: "tie-pilot-3", type: "photo", src: "./images/impirials/tie-pilot-3.jpg", position: "50% 9%",  size: "260% auto" },
    { id: "tie-pilot-4", type: "photo", src: "./images/impirials/tie-pilot-4.jpg", position: "50% 32%", size: "115% auto" },
    { id: "tie-pilot-5", type: "photo", src: "./images/impirials/tie-pilot-5.jpg", position: "50% 3%",  size: "120% auto" },
];
