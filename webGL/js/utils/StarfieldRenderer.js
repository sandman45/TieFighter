// Parameterized, verbatim port of the star-drawing math that used to live
// only inside missionBriefing.js's drawStars() — extracted so the campaign
// hero panel can reuse it without a new art asset.
export function paintStarfield(ctx, width, height, animFrame = 0, { seed = 42, density = 180 } = {}) {
    for (let i = 0; i < density; i++) {
        const sx     = (Math.sin(i * 127.1 + seed) * 0.5 + 0.5) * width;
        const sy     = (Math.sin(i * 311.7 + seed) * 0.5 + 0.5) * height;
        const size   = (Math.sin(i * 77.3)  * 0.5 + 0.5) * 1.2 + 0.3;
        const bright = (Math.sin(i * 53.1 + animFrame * 0.02) * 0.5 + 0.5) * 0.6 + 0.2;
        ctx.globalAlpha = bright;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx, sy, size, size);
    }
    ctx.globalAlpha = 1;
}
