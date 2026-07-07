// ── MISSION DATA ──────────────────────────────────────────────────────────────
// MISSION is now set dynamically from campaign config — see initBriefing
let MISSION = null;

// ── BRIEFING TEXT ─────────────────────────────────────────────────────────────
export function showTopic(topicKey) {
    if(!MISSION) return;
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

function drawPath(path, wpMap, strokeStyle) {
    if(!path || !path.length) return;
    for (let i = 0; i < path.length - 1; i++) {
        const a = wpMap[path[i]];
        const b = wpMap[path[i + 1]];
        if (!a || !b) continue;
        const pa = wp(a), pb = wp(b);
        ctx.lineDashOffset = -(animFrame * 0.3) % 20;
        ctx.strokeStyle = strokeStyle;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
    }
}

function drawFlightPath() {
    if(!MISSION) return;
    const wpMap = {};
    MISSION.mapWaypoints.forEach(w => { wpMap[w.id] = w; });

    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1;

    drawPath(MISSION.flightPath, wpMap, 'rgba(0, 170, 255, 0.35)');
    // enemy attack run — same dash style, red to match the enemy waypoint color
    drawPath(MISSION.enemyFlightPath, wpMap, 'rgba(204, 34, 0, 0.4)');

    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
}

function drawWaypoints() {
    if(!MISSION) return;
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
    mapAnimationId = requestAnimationFrame(renderMap);
}

// ── LAUNCH ────────────────────────────────────────────────────────────────────
let mapAnimationId = null;

export function initBriefing(campaignConfig, onLaunch) {
    // set mission data from campaign config
    MISSION = campaignConfig.briefing;
    MISSION.flightPath  = campaignConfig.briefing.flightPath;
    MISSION.mapWaypoints = campaignConfig.briefing.mapWaypoints;
    MISSION.enemyFlightPath = campaignConfig.briefing.enemyFlightPath || [];

    // populate header fields from campaign config
    document.getElementById('briefing-mission-title').textContent = campaignConfig.title;
    document.getElementById('briefing-sector-label').textContent  = campaignConfig.briefing.sector;
    document.getElementById('briefing-officer-name').textContent  = campaignConfig.briefing.officer.name;
    document.getElementById('briefing-officer-rank').textContent  = campaignConfig.briefing.officer.rank;
    document.getElementById('briefing-officer-speech').innerHTML  =
        `"${campaignConfig.briefing.officer.speech}"<span class="cursor">_</span>`;

    const officerImg = document.querySelector('.officer-portrait img');
    if(officerImg) officerImg.src = campaignConfig.briefing.officer.image;

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

    document.getElementById('briefingBackBtn').addEventListener('click', () => {
        cancelAnimationFrame(mapAnimationId);
        mapAnimationId = null;
        document.getElementById('mission-briefing').style.display    = 'none';
        document.getElementById('mission-briefing').style.visibility = 'hidden';
        document.getElementById('campaign-menu').style.visibility    = 'visible';
    });

    document.getElementById('launchBtn').addEventListener('click', () => {
        cancelAnimationFrame(mapAnimationId);
        mapAnimationId = null;
        if (typeof onLaunch === 'function') onLaunch();
    });
}