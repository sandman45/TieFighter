import EventBus from "../../eventBus/EventBus.js";
import events from "../../eventBus/events.js";

function toDisplayName(designation) {
    return designation
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export default ({ config, playerDesignation }) => {
    const remainingEnemies = new Set(config.destroyDesignations);
    const protectedDesignations = new Set(config.protectDesignations);
    let missionEnded = false;

    EventBus.subscribe(events.MISSION_COMPLETE, () => {
        missionEnded = true;
    });

    EventBus.subscribe(events.SHIP_DESTROYED, ({ designation }) => {
        if(missionEnded || !designation) return;

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
            if(remainingEnemies.size === 0) {
                EventBus.post(events.MISSION_OBJECTIVES_MET);
            }
        }
    });
};
