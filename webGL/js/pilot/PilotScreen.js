import PilotStore from "./PilotStore.js";
import portraits from "./portraits.js";

let built = false;

function portraitMarkup() {
    return `
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="22" r="14"/>
            <path d="M8 58 C8 40 20 34 32 34 C44 34 56 40 56 58 Z"/>
        </svg>
        <img class="pilot-portrait-photo" style="display:none;" alt="pilot portrait" />
    `;
}

export function buildScreen() {
    if (built) return;
    built = true;

    const container = document.getElementById('pilot-screen');
    container.innerHTML = `
        <div class="menu">
            <div class="menu-title">PILOT RECORD</div>

            <div class="pilot-portrait-row">
                <button class="ship-arrow-btn pilot-portrait-arrow" id="pilotPortraitPrev">&#9664;</button>
                <div class="pilot-portrait-box" id="pilotPortraitBox" data-variant="standard">
                    ${portraitMarkup()}
                </div>
                <button class="ship-arrow-btn pilot-portrait-arrow" id="pilotPortraitNext">&#9654;</button>
            </div>

            <div class="pilot-name-field">
                <span class="pilot-name-label">PILOT NAME</span>
                <span class="pilot-name-input-wrap">
                    <input id="pilot-name-input" maxlength="20" autocomplete="off" spellcheck="false" />
                    <span class="cursor">_</span>
                </span>
            </div>

            <div class="panel pilot-stats">
                <div class="panel-title">IMPERIAL DATABASE</div>
                <div class="stat-row"><span class="stat-label">RANK</span><span class="stat-value" id="pilot-stat-rank"></span></div>
                <div class="stat-row"><span class="stat-label">SCORE</span><span class="stat-value" id="pilot-stat-score"></span></div>
                <div class="stat-row"><span class="stat-label">MISSIONS FLOWN</span><span class="stat-value" id="pilot-stat-missions"></span></div>
            </div>

            <div id="pilot-index-indicator"></div>

            <div id="pilot-arrows" class="pilot-arrows">
                <button class="ship-arrow-btn" id="pilotArrowLeft">&#9664;</button>
                <button class="ship-arrow-btn" id="pilotArrowRight">&#9654;</button>
            </div>

            <div class="pilot-actions">
                <button id="pilotNewBtn" class="sub-menu-item" name="pilotnew">NEW PILOT</button>
                <button id="pilotBackBtn" class="nav-btn launch sub-menu-item" name="back">CONTINUE ►</button>
            </div>
        </div>
    `;

    const nameInput = document.getElementById('pilot-name-input');
    nameInput.addEventListener('input', () => {
        const active = PilotStore.getActivePilot();
        PilotStore.renamePilot(active.id, nameInput.value);
    });

    document.getElementById('pilotPortraitPrev').addEventListener('click', () => cyclePortrait(-1));
    document.getElementById('pilotPortraitNext').addEventListener('click', () => cyclePortrait(1));
}

function cyclePortrait(step) {
    const active = PilotStore.getActivePilot();
    const currentIndex = Math.max(0, portraits.findIndex(p => p.id === active.portraitId));
    const nextIndex = (currentIndex + step + portraits.length) % portraits.length;
    PilotStore.setPilotPortrait(active.id, portraits[nextIndex].id);
    renderActivePilot();
}

function renderPortrait(pilot) {
    const box = document.getElementById('pilotPortraitBox');
    const portrait = portraits.find(p => p.id === pilot.portraitId) || portraits[0];
    const svg = box.querySelector('svg');
    const img = box.querySelector('img');

    if (portrait.type === 'photo') {
        svg.style.display = 'none';
        img.style.display = 'block';
        img.src = portrait.src;
    } else {
        img.style.display = 'none';
        svg.style.display = 'block';
        box.setAttribute('data-variant', portrait.variant);
    }
}

export function renderActivePilot() {
    const pilot = PilotStore.getActivePilot();
    const pilots = PilotStore.getPilots();
    const index = pilots.findIndex(p => p.id === pilot.id);

    const nameInput = document.getElementById('pilot-name-input');
    if (document.activeElement !== nameInput) {
        nameInput.value = pilot.name;
    }

    document.getElementById('pilot-stat-rank').textContent = pilot.rank;
    document.getElementById('pilot-stat-score').textContent = pilot.score;
    document.getElementById('pilot-stat-missions').textContent = pilot.missionsFlown;
    document.getElementById('pilot-index-indicator').textContent = `PILOT ${index + 1} / ${pilots.length}`;

    const leftArrow = document.getElementById('pilotArrowLeft');
    const rightArrow = document.getElementById('pilotArrowRight');
    leftArrow.disabled = pilots.length <= 1;
    rightArrow.disabled = pilots.length <= 1;

    renderPortrait(pilot);

    if (!pilot.name) {
        nameInput.focus();
        nameInput.select();
    }
}

export default { buildScreen, renderActivePilot };
