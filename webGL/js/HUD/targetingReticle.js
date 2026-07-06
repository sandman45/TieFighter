import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

const RETICLE_COLOR       = '#00ff44';
const RETICLE_ALPHA       = 0.85;
const BRACKET_SIZE        = 40;   // minimum half-size of the corner brackets in px
const BRACKET_LEG         = 14;   // length of each bracket arm in px
const ARROW_MARGIN        = 48;   // px from screen edge for off-screen arrow
const ARROW_SIZE          = 14;   // px, half-width of arrowhead
const LOCK_PULSE_SPEED    = 2.5;  // hz, flicker rate when locked

export class TargetingReticle {
    constructor(overlayCanvas, camera) {
        this.canvas  = overlayCanvas;
        this.ctx     = overlayCanvas.getContext('2d');
        this.camera  = camera;
        this.target  = null;
        this.locked  = false;
        this._clock  = 0;
    }

    setTarget(object3D) {
        this.target = object3D;
        this.locked = false;
        this._clock = 0;
    }

    clearTarget() {
        this.target = null;
        this.locked = false;
        this._clearCanvas();
    }

    setLocked(locked) {
        this.locked = locked;
    }

    update(dt) {
        this._clearCanvas();
        if (!this.target || !this.camera) return;

        this.camera.updateMatrixWorld();
        this._clock += dt;

        // use Box3 center for accurate position on large models like ISD
        const box = new THREE.Box3().setFromObject(this.target);
        const worldPos = new THREE.Vector3();
        box.getCenter(worldPos);

        const ndc = worldPos.clone().project(this.camera);

        const W = this.canvas.width;
        const H = this.canvas.height;

        const sx = ( ndc.x * 0.5 + 0.5) * W;
        const sy = (-ndc.y * 0.5 + 0.5) * H;

        // scale bracket size to match the target's projected screen size
        const boxSize = new THREE.Vector3();
        box.getSize(boxSize);
        const maxDim = Math.max(boxSize.x, boxSize.y, boxSize.z);

        // project a point at maxDim distance from center to estimate screen size
        const edgePos  = worldPos.clone().add(new THREE.Vector3(maxDim * 0.5, 0, 0));
        const edgeNdc  = edgePos.clone().project(this.camera);
        const edgeSx   = (edgeNdc.x * 0.5 + 0.5) * W;
        const centerSx = (ndc.x * 0.5 + 0.5) * W;
        const dynamicBracket = Math.max(BRACKET_SIZE, Math.abs(edgeSx - centerSx));

        // ndc.z > 1 means behind the camera
        const behindCamera = ndc.z > 1;
        const onScreen = !behindCamera
            && sx > dynamicBracket
            && sx < W - dynamicBracket
            && sy > dynamicBracket
            && sy < H - dynamicBracket;

        const ctx = this.ctx;
        ctx.save();

        // pulse alpha when locked
        let alpha = RETICLE_ALPHA;
        if (this.locked) {
            alpha = 0.4 + 0.45 * Math.abs(Math.sin(this._clock * Math.PI * LOCK_PULSE_SPEED));
        }
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = RETICLE_COLOR;
        ctx.fillStyle   = RETICLE_COLOR;
        ctx.lineWidth   = 1.5;

        if (onScreen) {
            this._drawBrackets(ctx, sx, sy, dynamicBracket, BRACKET_LEG);
            if (this.locked) {
                this._drawLockText(ctx, sx, sy, dynamicBracket);
            }
        } else {
            this._drawOffScreenArrow(ctx, worldPos, W, H, behindCamera);
        }

        ctx.restore();
    }

    _clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    _drawBrackets(ctx, cx, cy, half, leg) {
        const L = cx - half, R = cx + half;
        const T = cy - half, B = cy + half;

        ctx.beginPath();
        // top-left
        ctx.moveTo(L, T + leg); ctx.lineTo(L, T); ctx.lineTo(L + leg, T);
        // top-right
        ctx.moveTo(R - leg, T); ctx.lineTo(R, T); ctx.lineTo(R, T + leg);
        // bottom-right
        ctx.moveTo(R, B - leg); ctx.lineTo(R, B); ctx.lineTo(R - leg, B);
        // bottom-left
        ctx.moveTo(L + leg, B); ctx.lineTo(L, B); ctx.lineTo(L, B - leg);
        ctx.stroke();
    }

    _drawLockText(ctx, cx, cy, half) {
        ctx.font = '8px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LOCKED', cx, cy + half + 14);
    }

    _drawOffScreenArrow(ctx, worldPos, W, H, behindCamera) {
        const cx = W / 2, cy = H / 2;

        const ndc = worldPos.clone().project(this.camera);
        let dx = ndc.x;
        let dy = -ndc.y;

        if (behindCamera) { dx = -dx; dy = -dy; }

        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        dx /= len; dy /= len;

        const margin = ARROW_MARGIN;
        const halfW  = cx - margin;
        const halfH  = cy - margin;

        let t = Infinity;
        if (dx !== 0) t = Math.min(t, (dx > 0 ?  halfW : -halfW) / dx);
        if (dy !== 0) t = Math.min(t, (dy > 0 ?  halfH : -halfH) / dy);

        const ax = cx + dx * t;
        const ay = cy + dy * t;

        const angle = Math.atan2(dy, dx);
        const s = ARROW_SIZE;

        ctx.beginPath();
        ctx.moveTo(ax + Math.cos(angle)       * s,
            ay + Math.sin(angle)       * s);
        ctx.lineTo(ax + Math.cos(angle + 2.4) * s * 0.7,
            ay + Math.sin(angle + 2.4) * s * 0.7);
        ctx.lineTo(ax + Math.cos(angle - 2.4) * s * 0.7,
            ay + Math.sin(angle - 2.4) * s * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(ax - dx * 6,  ay - dy * 6);
        ctx.lineTo(ax - dx * 20, ay - dy * 20);
        ctx.stroke();
    }
}