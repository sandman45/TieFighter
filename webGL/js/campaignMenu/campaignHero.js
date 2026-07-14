import { paintStarfield } from "../utils/StarfieldRenderer.js";

let canvas = null;
let ctx = null;
let frame = 0;
let rafId = null;
let seed = 42;

export function startHero(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resizeHero();
    if (rafId === null) loop();
}

export function resizeHero() {
    if (!canvas) return;
    canvas.width  = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
}

export function setHeroSeed(newSeed) {
    seed = newSeed;
}

export function stopHero() {
    if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paintStarfield(ctx, canvas.width, canvas.height, frame, { seed });
    frame++;
    rafId = requestAnimationFrame(loop);
}
