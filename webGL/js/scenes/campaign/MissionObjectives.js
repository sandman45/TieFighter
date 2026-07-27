import EventBus from "../../eventBus/EventBus.js";
import events from "../../eventBus/events.js";
import PilotStore from "../../pilot/PilotStore.js";
import { showToast } from "../../HUD/hud.js";

function toDisplayName(designation) {
    return designation
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// EventBus has no unsubscribe, and this factory re-subscribes on every mission
// (re)play — without a run guard, replaying a mission in the same session would
// stack duplicate closures and double-count kill score / duplicate MISSION_FAILED
// or MISSION_OBJECTIVES_MET posts.
let latestRunId = 0;
let missionScore = 0;

export function getMissionScore() {
    return missionScore;
}

export default ({ config, playerDesignation }) => {
    const runId = ++latestRunId;
    missionScore = 0;
    const remainingEnemies = new Set(config.destroyDesignations);
    const protectedDesignations = new Set(config.protectDesignations);
    const remainingInspections = new Set(config.inspectDesignations);
    // ships (e.g. TYDERIAN) whose scripted docking run must actually finish —
    // identifying the transport only clears them to launch, it doesn't mean
    // they've made it back to dock at the ISD yet
    const remainingEscorts = new Set(config.escortDesignations);
    let missionEnded = false;

    function checkComplete() {
        if(remainingEnemies.size === 0 && remainingInspections.size === 0 && remainingEscorts.size === 0) {
            EventBus.post(events.MISSION_OBJECTIVES_MET);
        }
    }

    EventBus.subscribe(events.MISSION_COMPLETE, () => {
        if(runId !== latestRunId) return;
        missionEnded = true;
    });

    EventBus.subscribe(events.TARGET_IDENTIFIED, ({ designation }) => {
        if(runId !== latestRunId || missionEnded || !designation) return;
        if(remainingInspections.has(designation)) {
            remainingInspections.delete(designation);
            checkComplete();
        }
    });

    EventBus.subscribe(events.SHUTTLE_DOCKED, ({ designation }) => {
        if(runId !== latestRunId || missionEnded || !designation) return;
        if(remainingEscorts.has(designation)) {
            remainingEscorts.delete(designation);
            showToast(`${toDisplayName(designation)} HAS RETURNED WITH THE PRISONERS — OBJECTIVE COMPLETE`);
            checkComplete();
        }
    });

    EventBus.subscribe(events.SHIP_DESTROYED, ({ designation }) => {
        if(runId !== latestRunId || missionEnded || !designation) return;

        if(designation === playerDesignation || protectedDesignations.has(designation)) {
            missionEnded = true;
            const reason = designation === playerDesignation
                ? "Your TIE Fighter was destroyed."
                : `${toDisplayName(designation)} was destroyed.`;
            EventBus.post(events.MISSION_FAILED, { reason, designation });
            return;
        }

        if(remainingEnemies.has(designation)) {
            remainingEnemies.delete(designation);
            missionScore += PilotStore.SCORE_VALUES.KILL;
            PilotStore.awardKillScore();
            checkComplete();
        }
    });
};
