import campaign from "./campaign.js";
import { startHero, stopHero, resizeHero, setHeroSeed } from "./campaignHero.js";

let missionKeys = [];
let currentIndex = 0;

function hashSeed(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return h;
}

function renderCurrent() {
    const emptyEl = document.getElementById('campaignEmptyState');
    const headerEl = document.querySelector('.campaign-header');
    const heroEl = document.querySelector('.campaign-hero-panel');
    const browseRow = document.querySelector('.campaign-browse-row');
    const joinBtn = document.getElementById('campaignJoinBtn');

    if (missionKeys.length === 0) {
        emptyEl.style.display = 'block';
        headerEl.style.display = 'none';
        heroEl.style.display = 'none';
        browseRow.style.display = 'none';
        joinBtn.style.display = 'none';
        return;
    }

    emptyEl.style.display = 'none';
    headerEl.style.display = '';
    heroEl.style.display = '';
    browseRow.style.display = '';
    joinBtn.style.display = '';

    const key = missionKeys[currentIndex];
    const config = campaign[key];

    document.getElementById('campaignBattleLabel').textContent  = `BATTLE ${currentIndex + 1}`;
    document.getElementById('campaignMissionTitle').textContent = (config.title || config.menuName || '').toUpperCase();
    document.getElementById('campaignTagline').textContent      = config.tagline || '';
    document.getElementById('campaignHeroSector').textContent   = (config.briefing && config.briefing.sector) || '';
    document.getElementById('campaignPageIndicator').textContent = `${currentIndex + 1} / ${missionKeys.length}`;

    document.getElementById('campaignPrevBtn').disabled = currentIndex === 0;
    document.getElementById('campaignNextBtn').disabled = currentIndex === missionKeys.length - 1;

    joinBtn.setAttribute('name', key);

    setHeroSeed(hashSeed(key));
    resizeHero();
}

function buildMenu() {
    missionKeys = Object.keys(campaign).filter(key => campaign[key].active);
    currentIndex = 0;

    // clone-and-replace to strip stale listeners from prior visits (matches missionBriefing.js pattern)
    const prevBtn = document.getElementById('campaignPrevBtn');
    const nextBtn = document.getElementById('campaignNextBtn');
    const freshPrev = prevBtn.cloneNode(true);
    const freshNext = nextBtn.cloneNode(true);
    prevBtn.replaceWith(freshPrev);
    nextBtn.replaceWith(freshNext);
    freshPrev.addEventListener('click', () => {
        if (currentIndex > 0) { currentIndex--; renderCurrent(); }
    });
    freshNext.addEventListener('click', () => {
        if (currentIndex < missionKeys.length - 1) { currentIndex++; renderCurrent(); }
    });

    const mainMenuBtn = document.getElementById('campaignMainMenuBtn');
    const joinBtn = document.getElementById('campaignJoinBtn');
    const freshMainMenuBtn = mainMenuBtn.cloneNode(true);
    const freshJoinBtn = joinBtn.cloneNode(true);
    mainMenuBtn.replaceWith(freshMainMenuBtn);
    joinBtn.replaceWith(freshJoinBtn);
    // these two also get onclick = onSubMenuItemClick from main.js's bindEventListeners()
    // (called right after CampaignMenu.buildMenu() in onMenuItemClick) — both listener
    // mechanisms coexist without conflict
    freshMainMenuBtn.addEventListener('click', stopHero);
    freshJoinBtn.addEventListener('click', stopHero);

    startHero(document.getElementById('campaignHeroCanvas'));
    window.removeEventListener('resize', resizeHero);
    window.addEventListener('resize', resizeHero);

    renderCurrent();
}

export default {
    buildMenu,
}
