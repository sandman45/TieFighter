// ── MISSION DATA ──────────────────────────────────────────────────────────────
// Swap this object out per mission to drive the whole briefing screen.
export const MISSION = {
    id: 'mission1',
    title: 'PATROL SIGMA-7',
    sector: 'SECTOR 7-G',
    mapWaypoints: [
        { id: 'nav1',  x: 0.15, y: 0.35, label: 'NAV 1',        type: 'nav',      primary: true },
        { id: 'nav2',  x: 0.38, y: 0.55, label: 'NAV 2',        type: 'nav',      primary: true },
        { id: 'nav3',  x: 0.62, y: 0.40, label: 'NAV 3',        type: 'nav',      primary: true },
        { id: 'obj1',  x: 0.50, y: 0.25, label: 'CONVOY',       type: 'target',   primary: true },
        { id: 'obj2',  x: 0.75, y: 0.60, label: 'STATION',      type: 'friendly'               },
        { id: 'start', x: 0.08, y: 0.70, label: 'LAUNCH POINT', type: 'player'                 },
        { id: 'reb1',  x: 0.45, y: 0.72, label: 'REBEL PATROL', type: 'enemy'                  },
        { id: 'reb2',  x: 0.68, y: 0.22, label: 'REBEL ESCORT', type: 'enemy'                  },
    ],
    flightPath: ['start', 'nav1', 'nav2', 'obj1', 'nav3', 'obj2'],
    topics: {
        situation: {
            header: 'SITUATION REPORT',
            text: `
        <p>Imperial convoy <span class="highlight">SIGMA-7</span> has been ambushed in sector 7-G by Rebel Alliance forces. The convoy, carrying critical hyperdrive components for the <span class="highlight">ISD RELENTLESS</span>, has requested immediate fighter escort.</p>
        <p>Rebel X-Wing and Y-Wing squadrons have been detected in the area. Intelligence suggests a coordinated strike intended to capture or destroy the cargo.</p>
        <p>You will launch immediately and intercept all hostile craft before they can disable the convoy transports.</p>
      `
        },
        objectives: {
            header: 'PRIMARY OBJECTIVES',
            text: `
        <div class="objective-item"><span class="obj-marker">►</span><span>Destroy all Rebel <span class="highlight">X-WING</span> fighters in sector</span></div>
        <div class="objective-item"><span class="obj-marker">►</span><span>Protect convoy transports <span class="highlight">SIGMA 1</span> through <span class="highlight">SIGMA 4</span></span></div>
        <div class="objective-item"><span class="obj-marker">►</span><span>Ensure safe passage to rendezvous point <span class="highlight">NAV 3</span></span></div>
        <p style="margin-top:10px; color: var(--text-dim); font-size:9px;">Failure to protect the convoy will result in mission failure. All transport losses will be logged in your service record.</p>
      `
        },
        secondary: {
            header: 'SECONDARY OBJECTIVES',
            text: `
        <div class="objective-item"><span class="obj-marker">◆</span><span>Capture Rebel <span class="highlight">Y-WING</span> leader — disable, do not destroy</span></div>
        <div class="objective-item"><span class="obj-marker">◆</span><span>Inspect cargo container <span class="highlight">CRG ALPHA</span> for contraband</span></div>
        <p style="margin-top:10px; color: var(--text-dim); font-size:9px;">Secondary objectives are optional but completion will be noted in your Imperial service record.</p>
      `
        },
        craft: {
            header: 'FLIGHT ASSIGNMENT',
            text: `
        <p>ASSIGNED CRAFT: <span class="highlight">TIE/LN FIGHTER</span></p>
        <p>DESIGNATION: <span class="highlight">ALPHA ONE</span></p>
        <p>WING: <span class="highlight">ALPHA SQUADRON</span> · 4 CRAFT</p>
        <p style="margin-top:8px;">LOADOUT:</p>
        <div class="objective-item"><span class="obj-marker">·</span><span>LASER CANNONS — STANDARD</span></div>
        <div class="objective-item"><span class="obj-marker">·</span><span>NO WARHEAD CAPACITY</span></div>
        <div class="objective-item"><span class="obj-marker">·</span><span>NO SHIELDS — SPEED IS YOUR DEFENSE</span></div>
        <p style="margin-top:8px; color: var(--text-dim); font-size:9px;">The TIE/ln has no shields or hyperdrive. Do not stray from the operational area.</p>
      `
        },
        threats: {
            header: 'THREAT ASSESSMENT',
            text: `
        <p>CONFIRMED HOSTILES:</p>
        <div class="objective-item"><span class="obj-marker" style="color:#cc2200">▲</span><span><span class="highlight">RED SQUADRON</span> — 4× T-65 X-WING · HIGH THREAT</span></div>
        <div class="objective-item"><span class="obj-marker" style="color:#cc2200">▲</span><span><span class="highlight">GOLD SQUADRON</span> — 2× BTL Y-WING · MEDIUM THREAT</span></div>
        <p style="margin-top:8px; color: var(--text-dim); font-size:9px;">X-Wings are faster and better shielded than your craft. Use superior maneuverability. Attack Y-Wings from the rear to avoid ion cannons.</p>
      `
        }
    }
};

// ── BRIEFING TEXT ─────────────────────────────────────────────────────────────
export function showTopic(topicKey) {
    const topic = MISSION.topics[topicKey];
    if (!topic) return;

    document.getElementById('briefingHeader').textContent = topic.header;

    const el = document.getElementById('briefingText');
    el.style.opacity = '0';
    setTimeout(() => {
        el.innerHTML = topic.text;
        el.style.transition = 'opacity 0.2s ease';
        el.style.opacity = '1';
    }, 100);

    document.querySelectorAll('.question-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.topic === topicKey);
    });
}

// ── STAR MAP ──────────────────────────────────────────────────────────────────
const mapCanvas = document.getElementById('starMap');
const ctx = mapCanvas.getContext('2d');

let animFrame = 0;

const COLORS = {
    nav:      '#00aaff',
    target:   '#cc7700',
    friendly: '#00cc44',
    enemy:    '#cc2200',
    player:   '#ffffff',
};

export function resizeMap() {
    const container = mapCanvas.parentElement;
    mapCanvas.width  = container.offsetWidth;
    mapCanvas.height = container.offsetHeight;
}

function drawStars() {
    const seed = 42;
    for (let i = 0; i < 180; i++) {
        const sx     = (Math.sin(i * 127.1 + seed) * 0.5 + 0.5) * mapCanvas.width;
        const sy     = (Math.sin(i * 311.7 + seed) * 0.5 + 0.5) * mapCanvas.height;
        const size   = (Math.sin(i * 77.3)  * 0.5 + 0.5) * 1.2 + 0.3;
        const bright = (Math.sin(i * 53.1 + animFrame * 0.02) * 0.5 + 0.5) * 0.6 + 0.2;
        ctx.globalAlpha = bright;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx, sy, size, size);
    }
    ctx.globalAlpha = 1;
}

function wp(waypoint) {
    return {
        x: waypoint.x * mapCanvas.width,
        y: waypoint.y * mapCanvas.height,
    };
}

function drawFlightPath() {
    const path  = MISSION.flightPath;
    const wpMap = {};
    MISSION.mapWaypoints.forEach(w => { wpMap[w.id] = w; });

    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1;

    for (let i = 0; i < path.length - 1; i++) {
        const a = wpMap[path[i]];
        const b = wpMap[path[i + 1]];
        if (!a || !b) continue;
        const pa = wp(a), pb = wp(b);
        ctx.lineDashOffset = -(animFrame * 0.3) % 20;
        ctx.strokeStyle = 'rgba(0, 170, 255, 0.35)';
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
}

function drawWaypoints() {
    MISSION.mapWaypoints.forEach(waypoint => {
        const { x, y } = wp(waypoint);
        const color = COLORS[waypoint.type] || '#ffffff';
        const pulse = Math.sin(animFrame * 0.05 + waypoint.x * 10) * 0.5 + 0.5;

        if (waypoint.type === 'player') {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.PI / 4);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-5, -5, 10, 10);
            ctx.restore();
        } else if (waypoint.type === 'enemy') {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.6 + pulse * 0.4;
            ctx.beginPath();
            ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y + 6);
            ctx.moveTo(x + 6, y - 6); ctx.lineTo(x - 6, y + 6);
            ctx.stroke();
            ctx.globalAlpha = 1;
        } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3 + pulse * 0.15;
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();

            if (waypoint.primary) {
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                const s = 8;
                ctx.beginPath();
                ctx.moveTo(x - s, y - s + 3); ctx.lineTo(x - s, y - s); ctx.lineTo(x - s + 3, y - s);
                ctx.moveTo(x + s - 3, y - s); ctx.lineTo(x + s, y - s); ctx.lineTo(x + s, y - s + 3);
                ctx.moveTo(x + s, y + s - 3); ctx.lineTo(x + s, y + s); ctx.lineTo(x + s - 3, y + s);
                ctx.moveTo(x - s + 3, y + s); ctx.lineTo(x - s, y + s); ctx.lineTo(x - s, y + s - 3);
                ctx.stroke();
            }
        }

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.8;
        ctx.font = '8px "Share Tech Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(waypoint.label, x + 12, y + 3);
        ctx.globalAlpha = 1;
    });
}

function drawGridLines() {
    ctx.strokeStyle = 'rgba(0, 80, 20, 0.25)';
    ctx.lineWidth = 0.5;
    const cols = 8, rows = 6;

    for (let i = 1; i < cols; i++) {
        const x = (mapCanvas.width / cols) * i;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, mapCanvas.height); ctx.stroke();
    }
    for (let i = 1; i < rows; i++) {
        const y = (mapCanvas.height / rows) * i;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(mapCanvas.width, y); ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0, 80, 20, 0.5)';
    ctx.font = '7px "Share Tech Mono", monospace';
    const colLabels = ['A','B','C','D','E','F','G','H'];
    colLabels.forEach((l, i) => {
        ctx.fillText(l, (mapCanvas.width / cols) * i + 4, 10);
    });
    for (let i = 0; i < rows; i++) {
        ctx.fillText(i + 1, 4, (mapCanvas.height / rows) * i + 14);
    }
}

function renderMap() {
    ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    drawStars();
    drawGridLines();
    drawFlightPath();
    drawWaypoints();
    animFrame++;
    mapAnimationId = requestAnimationFrame(renderMap);  // <-- store the ID
}

// ── LAUNCH ────────────────────────────────────────────────────────────────────
export function initLaunchBtn(onLaunch) {
    document.getElementById('launchBtn').addEventListener('click', () => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '0';
        document.body.style.opacity = '1';  // <-- restore visibility
        document.body.style.transition = '';
        if (typeof onLaunch === 'function') {
            onLaunch();
        }
    });
}

let mapAnimationId = null;
let briefingInitialised = false;

export function initBriefing(onLaunch) {

    // cancel any previous map animation loop
    if (mapAnimationId !== null) {
        cancelAnimationFrame(mapAnimationId);
        mapAnimationId = null;
    }

    // remove old listeners by replacing buttons with clones
    const launchBtn = document.getElementById('launchBtn');
    const backBtn   = document.getElementById('briefingBackBtn');
    launchBtn.replaceWith(launchBtn.cloneNode(true));
    backBtn.replaceWith(backBtn.cloneNode(true));

    // re-query after clone
    document.querySelectorAll('.question-btn').forEach(btn => {
        btn.replaceWith(btn.cloneNode(true));
    });
    document.querySelectorAll('.question-btn').forEach(btn => {
        btn.addEventListener('click', () => showTopic(btn.dataset.topic));
    });

    showTopic('situation');

    window.removeEventListener('resize', resizeMap);
    window.addEventListener('resize', resizeMap);
    resizeMap();
    renderMap();

    // back button
    document.getElementById('briefingBackBtn').addEventListener('click', () => {
        cancelAnimationFrame(mapAnimationId);
        mapAnimationId = null;
        document.getElementById('mission-briefing').style.display    = 'none';
        document.getElementById('mission-briefing').style.visibility = 'hidden';
        document.getElementById('campaign-menu').style.visibility    = 'visible';
    });

    initLaunchBtn(onLaunch);
}