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

function deletePilot(id) {
    const pilots = getPilots().filter(p => p.id !== id);
    writePilots(pilots);

    if (LocalStorage.getItem(ACTIVE_PILOT_ID_KEY) !== id) return;

    if (pilots.length > 0) {
        setActivePilotId(pilots[pilots.length - 1].id);
    } else {
        // leave PILOTS as an empty array — the next getPilots() call
        // auto-reseeds a fresh default pilot and makes it active
        LocalStorage.removeItem(ACTIVE_PILOT_ID_KEY);
    }
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
    deletePilot,
    renamePilot,
    setPilotPortrait,
    awardKillScore,
    awardMissionCompleteBonus,
    incrementMissionsFlown,
};
