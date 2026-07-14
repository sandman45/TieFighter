import EventBus from "../../eventBus/EventBus.js";
import events from "../../eventBus/events.js";
import PilotStore from "../../pilot/PilotStore.js";

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
    let missionEnded = false;

    EventBus.subscribe(events.MISSION_COMPLETE, () => {
        if(runId !== latestRunId) return;
        missionEnded = true;
    });

    EventBus.subscribe(events.SHIP_DESTROYED, ({ designation }) => {
        if(runId !== latestRunId || missionEnded || !designation) return;

        if(designation === playerDesignation || protectedDesignations.has(designation)) {
            missionEnded = true;
            const reason = designation === playerDesignation
                ? "Your TIE Fighter was destroyed."
                : `${toDisplayName(designation)} was destroyed.`;
            EventBus.post(events.MISSION_FAILED, { reason });
            return;
        }

        if(remainingEnemies.has(designation)) {
            remainingEnemies.delete(designation);
            missionScore += PilotStore.SCORE_VALUES.KILL;
            PilotStore.awardKillScore();
            if(remainingEnemies.size === 0) {
                EventBus.post(events.MISSION_OBJECTIVES_MET);
            }
        }
    });
};
