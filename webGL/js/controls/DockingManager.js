import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import EventBus from "../eventBus/EventBus.js";
import events from "../eventBus/events.js";

const DOCK_RANGE = 150;
const DOCK_THROTTLE_THRESHOLD = 0.15;

function getBoxCenter(mesh) {
    const box = new THREE.Box3().setFromObject(mesh);
    const center = new THREE.Vector3();
    box.getCenter(center);
    return center;
}

export default ({ playerMesh, targetMesh, flyControls, isdDesignation }) => {
    const promptElement = document.getElementById('dock-prompt');
    let objectivesMet = false;
    // a failure that leaves the ISD itself intact (e.g. losing the shuttle or
    // the transport) still lets the player fly home and dock — that return
    // trip is what actually ends the mission, rather than cutting straight
    // to the debrief screen. Losing the ISD is handled separately (see
    // MissionFailureManager) since there's nothing left to dock at.
    let failed = false;
    let docked = false;

    EventBus.subscribe(events.MISSION_OBJECTIVES_MET, () => {
        objectivesMet = true;
    });

    EventBus.subscribe(events.MISSION_FAILED, ({ designation }) => {
        if(designation === isdDesignation) return;
        failed = true;
    });

    function isEligible() {
        if((!objectivesMet && !failed) || docked || !targetMesh || playerMesh.hull <= 0 || targetMesh.hull <= 0) return false;
        const distance = playerMesh.position.distanceTo(getBoxCenter(targetMesh));
        return distance < DOCK_RANGE && parseFloat(flyControls.throttle) <= DOCK_THROTTLE_THRESHOLD;
    }

    function update() {
        if(promptElement) {
            promptElement.style.visibility = isEligible() ? 'visible' : 'hidden';
        }
    }

    function attemptDock() {
        if(!isEligible()) return;
        docked = true;
        if(promptElement) promptElement.style.visibility = 'hidden';
        EventBus.post(failed ? events.MISSION_FAILED_RETURNED : events.MISSION_COMPLETE);
    }

    return { update, attemptDock };
};
