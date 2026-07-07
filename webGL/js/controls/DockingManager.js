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

export default ({ playerMesh, targetMesh, flyControls }) => {
    const promptElement = document.getElementById('dock-prompt');
    let objectivesMet = false;
    let docked = false;

    EventBus.subscribe(events.MISSION_OBJECTIVES_MET, () => {
        objectivesMet = true;
    });

    function isEligible() {
        if(!objectivesMet || docked || !targetMesh || playerMesh.hull <= 0) return false;
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
        EventBus.post(events.MISSION_COMPLETE);
    }

    return { update, attemptDock };
};
