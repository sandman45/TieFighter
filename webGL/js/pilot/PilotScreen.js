import PilotStore from "./PilotStore.js";
import portraits from "./portraits.js";
import { showToast } from "../HUD/hud.js";

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

            <div class="pilot-panels">
                <div class="pilot-list-panel panel">
                    <div class="panel-title">PILOTS</div>
                    <div class="pilot-list" id="pilot-list"></div>
                    <div class="pilot-name-field">
                        <span class="pilot-name-input-wrap" id="pilot-name-input-wrap">
                            <input id="pilot-name-input" maxlength="20" autocomplete="off" spellcheck="false" placeholder="ENTER PILOT NAME" />
                            <span class="cursor">_</span>
                        </span>
                    </div>
                </div>

                <div class="panel pilot-stats">
                    <div class="panel-title">IMPERIAL DATABASE</div>
                    <div class="stat-row"><span class="stat-label">RANK</span><span class="stat-value" id="pilot-stat-rank"></span></div>
                    <div class="stat-row"><span class="stat-label">SCORE</span><span class="stat-value" id="pilot-stat-score"></span></div>
                    <div class="stat-row"><span class="stat-label">MISSIONS FLOWN</span><span class="stat-value" id="pilot-stat-missions"></span></div>
                </div>
            </div>

            <div class="pilot-actions">
                <button id="pilotNewBtn" class="sub-menu-item" name="pilotnew">NEW PILOT</button>
                <button id="pilotDeleteBtn" class="sub-menu-item pilot-delete-btn" name="pilotdelete">DELETE PILOT</button>
                <button id="pilotBackBtn" class="nav-btn launch sub-menu-item" name="back">CONTINUE ►</button>
            </div>
        </div>

        <div id="pilot-delete-confirm" class="pilot-delete-confirm" style="display:none;">
            <div class="pilot-delete-confirm-box panel">
                <div class="panel-title">CONFIRM DELETION</div>
                <div class="pilot-delete-confirm-text" id="pilot-delete-confirm-text"></div>
                <div class="pilot-delete-confirm-actions">
                    <button id="pilotDeleteCancelBtn" class="sub-menu-item" name="pilotdeletecancel">CANCEL</button>
                    <button id="pilotDeleteConfirmBtn" class="sub-menu-item pilot-delete-btn" name="pilotdeleteconfirm">CONFIRM DELETE</button>
                </div>
            </div>
        </div>
    `;

    const nameInput = document.getElementById('pilot-name-input');
    nameInput.addEventListener('input', () => {
        const active = PilotStore.getActivePilot();
        PilotStore.renamePilot(active.id, nameInput.value);
        renderPilotList(); // keep the list label in sync as the player types
    });

    document.getElementById('pilotPortraitPrev').addEventListener('click', () => cyclePortrait(-1));
    document.getElementById('pilotPortraitNext').addEventListener('click', () => cyclePortrait(1));

    document.getElementById('pilotDeleteBtn').addEventListener('click', showDeleteConfirm);
    document.getElementById('pilotDeleteCancelBtn').addEventListener('click', hideDeleteConfirm);
    document.getElementById('pilotDeleteConfirmBtn').addEventListener('click', confirmDeleteActivePilot);
}

function showDeleteConfirm() {
    const pilot = PilotStore.getActivePilot();
    const label = pilot.name || 'THIS UNNAMED PILOT';
    document.getElementById('pilot-delete-confirm-text').textContent =
        `DELETE ${label}? THIS CANNOT BE UNDONE.`;
    document.getElementById('pilot-delete-confirm').style.display = 'flex';
}

function hideDeleteConfirm() {
    document.getElementById('pilot-delete-confirm').style.display = 'none';
}

function confirmDeleteActivePilot() {
    const pilot = PilotStore.getActivePilot();
    PilotStore.deletePilot(pilot.id);
    hideDeleteConfirm();
    renderActivePilot();
    showToast(`PILOT ${pilot.name || 'RECORD'} DELETED`, 4000);
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

function selectPilot(id) {
    PilotStore.setActivePilotId(id);
    renderActivePilot();
}

function renderPilotList() {
    const pilots = PilotStore.getPilots();
    const activePilot = PilotStore.getActivePilot();
    const listEl = document.getElementById('pilot-list');

    listEl.innerHTML = pilots.map(p => `
        <div class="pilot-list-item${p.id === activePilot.id ? ' active' : ''}" data-pilot-id="${p.id}">
            ${p.name ? escapeHtml(p.name) : '<span class="pilot-list-item-unnamed">UNNAMED</span>'}
        </div>
    `).join('');

    listEl.querySelectorAll('.pilot-list-item').forEach(el => {
        el.addEventListener('click', () => selectPilot(el.getAttribute('data-pilot-id')));
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function createNewPilot() {
    PilotStore.createPilot();
    renderActivePilot();
    showToast('NEW PILOT CREATED — ENTER A NAME BELOW', 4000);

    const wrap = document.getElementById('pilot-name-input-wrap');
    wrap.classList.remove('flash');
    void wrap.offsetWidth; // restart the animation if triggered again in quick succession
    wrap.classList.add('flash');
}

export function renderActivePilot() {
    const pilot = PilotStore.getActivePilot();

    const nameInput = document.getElementById('pilot-name-input');
    if (document.activeElement !== nameInput) {
        nameInput.value = pilot.name;
    }

    document.getElementById('pilot-stat-rank').textContent = pilot.rank;
    document.getElementById('pilot-stat-score').textContent = pilot.score;
    document.getElementById('pilot-stat-missions').textContent = pilot.missionsFlown;

    renderPortrait(pilot);
    renderPilotList();

    if (!pilot.name) {
        nameInput.focus();
        nameInput.select();
    }
}

export default { buildScreen, renderActivePilot, createNewPilot };
