import LocalStorage from "../localStorage/localStorage.js";

const PILOTS_KEY = "PILOTS";
const ACTIVE_PILOT_ID_KEY = "ACTIVE_PILOT_ID";

const RANKS = [
    { name: "FLT. CADET",    minScore: 0 },
    { name: "ENSIGN",        minScore: 500 },
    { name: "LIEUTENANT",    minScore: 1500 },
    { name: "LT. COMMANDER", minScore: 3000 },
    { name: "COMMANDER",     minScore: 5500 },
    { name: "CAPTAIN",       minScore: 9000 },
    { name: "COMMODORE",     minScore: 14000 },
    { name: "ADMIRAL",       minScore: 20000 },
];

const SCORE_VALUES = {
    KILL: 100,
    MISSION_COMPLETE_BONUS: 500,
};

function rankForScore(score) {
    let rank = RANKS[0].name;
    for (const tier of RANKS) {
        if (score >= tier.minScore) rank = tier.name;
    }
    return rank;
}

function makeId() {
    return `pilot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeDefaultPilot() {
    return {
        id: makeId(),
        name: "ALPHA ONE",
        score: 0,
        missionsFlown: 0,
        portraitId: "tie-pilot-standard",
        createdAt: Date.now(),
    };
}

function readPilots() {
    return LocalStorage.getItem(PILOTS_KEY);
}

function writePilots(pilots) {
    LocalStorage.setItem(PILOTS_KEY, pilots);
}

function getPilots() {
    let pilots = readPilots();
    if (!pilots || pilots.length === 0) {
        const defaultPilot = makeDefaultPilot();
        pilots = [defaultPilot];
        writePilots(pilots);
        LocalStorage.setItem(ACTIVE_PILOT_ID_KEY, defaultPilot.id);
    }
    return pilots;
}

function withRank(pilot) {
    return { ...pilot, rank: rankForScore(pilot.score) };
}

function getActivePilot() {
    const pilots = getPilots();
    const activeId = LocalStorage.getItem(ACTIVE_PILOT_ID_KEY);
    const found = pilots.find(p => p.id === activeId);
    return withRank(found || pilots[0]);
}

function setActivePilotId(id) {
    LocalStorage.setItem(ACTIVE_PILOT_ID_KEY, id);
}

function createPilot() {
    const pilots = getPilots();
    const pilot = {
        id: makeId(),
        name: "",
        score: 0,
        missionsFlown: 0,
        portraitId: "tie-pilot-standard",
        createdAt: Date.now(),
    };
    pilots.push(pilot);
    writePilots(pilots);
    setActivePilotId(pilot.id);
    return withRank(pilot);
}

function renamePilot(id, name) {
    const pilots = getPilots();
    const pilot = pilots.find(p => p.id === id);
    if (!pilot) return;
    pilot.name = String(name).slice(0, 20);
    writePilots(pilots);
}

function setPilotPortrait(id, portraitId) {
    const pilots = getPilots();
    const pilot = pilots.find(p => p.id === id);
    if (!pilot) return;
    pilot.portraitId = portraitId;
    writePilots(pilots);
}

function cycleBy(step) {
    const pilots = getPilots();
    if (pilots.length <= 1) return getActivePilot();
    const activeId = LocalStorage.getItem(ACTIVE_PILOT_ID_KEY);
    const currentIndex = Math.max(0, pilots.findIndex(p => p.id === activeId));
    const nextIndex = (currentIndex + step + pilots.length) % pilots.length;
    setActivePilotId(pilots[nextIndex].id);
    return withRank(pilots[nextIndex]);
}

function cycleNext() {
    return cycleBy(1);
}

function cyclePrev() {
    return cycleBy(-1);
}

function awardKillScore() {
    const pilots = getPilots();
    const activeId = LocalStorage.getItem(ACTIVE_PILOT_ID_KEY);
    const pilot = pilots.find(p => p.id === activeId) || pilots[0];
    pilot.score += SCORE_VALUES.KILL;
    writePilots(pilots);
    return SCORE_VALUES.KILL;
}

function awardMissionCompleteBonus() {
    const pilots = getPilots();
    const activeId = LocalStorage.getItem(ACTIVE_PILOT_ID_KEY);
    const pilot = pilots.find(p => p.id === activeId) || pilots[0];
    pilot.score += SCORE_VALUES.MISSION_COMPLETE_BONUS;
    writePilots(pilots);
    return SCORE_VALUES.MISSION_COMPLETE_BONUS;
}

function incrementMissionsFlown() {
    const pilots = getPilots();
    const activeId = LocalStorage.getItem(ACTIVE_PILOT_ID_KEY);
    const pilot = pilots.find(p => p.id === activeId) || pilots[0];
    pilot.missionsFlown += 1;
    writePilots(pilots);
}

export default {
    RANKS,
    SCORE_VALUES,
    rankForScore,
    getPilots,
    getActivePilot,
    setActivePilotId,
    createPilot,
    renamePilot,
    setPilotPortrait,
    cycleNext,
    cyclePrev,
    awardKillScore,
    awardMissionCompleteBonus,
    incrementMissionsFlown,
};
