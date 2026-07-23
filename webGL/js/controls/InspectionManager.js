import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import eventBus from "../eventBus/EventBus.js";
import events from "../eventBus/events.js";

const INSPECT_RANGE = 200;

function getBoxCenter(mesh) {
    const box = new THREE.Box3().setFromObject(mesh);
    const center = new THREE.Vector3();
    box.getCenter(center);
    return center;
}

export default ({ playerMesh, hud }) => {
    function update() {
        const target = hud.getCurrentTarget();
        const distanceEl = document.getElementById('target-distance-readout');

        // hud.getCurrentTarget() is pre-seeded to a default ship for the 3D
        // target-computer camera even before the player locks a target via T —
        // only treat a target as "active" once it matches what #target-name is
        // actually showing (same id the TARGET_DAMAGED/TARGET_IDENTIFIED HUD
        // handlers already match against)
        const nameEl = document.getElementById('target-name');
        const lockedTargetId = nameEl && nameEl.dataset.targetUserId;
        const hasLockedTarget = target && lockedTargetId
            && (lockedTargetId === target.userId || lockedTargetId === target.designation);

        if(!hasLockedTarget) {
            if(distanceEl) distanceEl.textContent = '--';
            return;
        }

        const distance = playerMesh.position.distanceTo(getBoxCenter(target));
        if(distanceEl) distanceEl.textContent = Math.round(distance);

        if(target.identified || playerMesh.hull <= 0 || distance >= INSPECT_RANGE) return;

        target.identified = true;
        eventBus.post(events.TARGET_IDENTIFIED, {
            userId: target.userId,
            designation: target.designation,
            faction: target.faction,
            cargo: target.cargo || 'None',
        });
    }

    return { update };
};
