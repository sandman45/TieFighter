import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import EventBus from "../eventBus/EventBus.js";
import events from "../eventBus/events.js";

const SEGMENT_COUNT = 10;

export function updateBar(barId, current, max, flash = true) {
    const bar = document.getElementById(barId);
    if (!bar) return;

    const segments = bar.querySelectorAll('.segment');
    const activePct = max > 0 ? current / max : 0;
    const activeCount = Math.ceil(activePct * SEGMENT_COUNT);

    // skip the flash-on-hit animation for bars that update continuously
    // (like the recharging weapon bar) — it would just strobe otherwise
    if (flash) {
        bar.classList.remove('hit');
        void bar.offsetWidth;
        bar.classList.add('hit');
    }

    segments.forEach((seg, i) => {
        const isActive = i < activeCount;
        seg.classList.toggle('active', isActive);

        if (barId === 'hull-bar' && isActive) {
            seg.classList.remove('warning', 'critical');
            if (activePct <= 0.25) {
                seg.classList.add('critical');
            } else if (activePct <= 0.5) {
                seg.classList.add('warning');
            }
        }
    });
}

let toastTimeout = null;
const MAX_LOG_ENTRIES = 20;

export function logMessage(message) {
    const entriesEl = document.getElementById('message-log-entries');
    if(!entriesEl) return;

    const entry = document.createElement('div');
    entry.className = 'message-log-entry';
    const timestamp = new Date().toLocaleTimeString([], { hour12: false });
    entry.innerHTML = `<span class="log-timestamp">${timestamp}</span>${message}`;
    entriesEl.appendChild(entry);

    while(entriesEl.children.length > MAX_LOG_ENTRIES) {
        entriesEl.removeChild(entriesEl.firstChild);
    }
    entriesEl.scrollTop = entriesEl.scrollHeight;
}

export function showToast(message, durationMs = 8000) {
    const toast = document.getElementById('mission-toast');
    if(toast) {
        toast.textContent = message;
        toast.classList.add('visible');

        if(toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('visible');
        }, durationMs);
    }

    logMessage(message);
}

export function initHUD(playerConfig) {
    const entriesEl = document.getElementById('message-log-entries');
    if(entriesEl) entriesEl.innerHTML = '';

    updateBar('shield-bar', playerConfig.shields, playerConfig.shields);
    updateBar('hull-bar', playerConfig.hull, playerConfig.hull);
    updateBar('laser-bar', 1, 1, false);

    EventBus.subscribe(events.MISSION_OBJECTIVES_MET, () => {
        showToast('OBJECTIVES COMPLETE — RETURN TO ISD VICTORIOUS AND DOCK');
    });

    EventBus.subscribe(events.PLAYER_DAMAGED, ({ shields, maxShields, hull, maxHull }) => {
        updateBar('shield-bar', shields, maxShields);
        updateBar('hull-bar', hull, maxHull);
    });

    EventBus.subscribe(events.WEAPON_ENERGY_CHANGED, ({ energy, maxEnergy }) => {
        updateBar('laser-bar', energy, maxEnergy, false);
    });

    EventBus.subscribe(events.SHIP_DESTROYED, ({ userId, designation, name, faction }) => {
        const label = designation || name || userId || 'UNKNOWN CONTACT';
        const side = faction === 'REBELLION' ? 'ENEMY' : 'FRIENDLY';
        logMessage(`${side} SHIP DESTROYED — ${label}`);
    });

    // applies the identified look (cargo readout + hostile/neutral/friendly name
    // color) — shared by TARGET_CHANGED (re-locking an already-identified ship)
    // and TARGET_IDENTIFIED (the moment a ship first gets identified)
    function applyIdentification(nameEl, faction, cargo) {
        const cargoEl = document.getElementById('target-cargo-readout');
        if(cargoEl) cargoEl.textContent = (cargo || 'None').toUpperCase();

        nameEl.classList.remove('hostile', 'friendly', 'neutral');
        if(faction === 'REBELLION') {
            nameEl.classList.add('hostile');
        } else if(faction === 'NEUTRAL') {
            nameEl.classList.add('neutral');
        } else {
            nameEl.classList.add('friendly');
        }
    }

    // userId is now destructured from the event payload
    EventBus.subscribe(events.TARGET_CHANGED, ({ shields, maxShields, hull, maxHull, name, designation, userId, speed, identified, faction, cargo } = {}) => {
        const label = designation || name || userId;
        const nameEl = document.getElementById('target-name');
        if(nameEl) {
            nameEl.textContent = label || 'NO TARGET';
            nameEl.dataset.targetUserId = label ? (userId || designation || '') : '';

            if(label && identified) {
                applyIdentification(nameEl, faction, cargo);
            } else {
                nameEl.classList.remove('hostile', 'friendly', 'neutral');
                const cargoEl = document.getElementById('target-cargo-readout');
                if(cargoEl) cargoEl.textContent = label ? 'UNKNOWN' : '--';
            }
        }
        updateBar('target-shield-bar', shields || 0, maxShields || 1);
        updateBar('target-hull-bar', hull || 0, maxHull || 1);

        const speedEl = document.getElementById('target-speed-readout');
        if(speedEl) speedEl.textContent = (label && speed !== undefined) ? speed.toFixed(1) : '--';
    });

    // fires once a targeted ship is flown close enough to identify — see InspectionManager
    EventBus.subscribe(events.TARGET_IDENTIFIED, ({ userId, designation, faction, cargo }) => {
        const nameEl = document.getElementById('target-name');
        const currentTargetId = nameEl && nameEl.dataset.targetUserId;
        if(!currentTargetId || (currentTargetId !== userId && currentTargetId !== designation)) return;

        applyIdentification(nameEl, faction, cargo);

        // recorded in the comms log, but not popped as a toast — with several
        // ships already in range at mission start, cycling targets would
        // otherwise fire a toast per ship
        logMessage(`COMMAND: Contact identified — ${nameEl.textContent} confirmed ${faction || 'UNKNOWN'}.`);
    });

    // userId and designation both destructured, currentTargetId read from the element
    EventBus.subscribe(events.TARGET_DAMAGED, ({ shields, maxShields, hull, maxHull, userId, designation }) => {
        const nameEl = document.getElementById('target-name');
        const currentTargetId = nameEl && nameEl.dataset.targetUserId;
        if(currentTargetId && (currentTargetId === userId || currentTargetId === designation)) {
            updateBar('target-shield-bar', shields, maxShields);
            updateBar('target-hull-bar', hull, maxHull);
        }
    });
}

export default class HUD {
    constructor(target, camera){
        this.camera = camera;
        if(target){
            this.target = target;
            this.goal = new THREE.Object3D();
            target.add( this.goal );
            this.goal.position.set(0, 5, 20);
            this.setCameraPositionRelativeToMeshAndFollow(this.camera, target);
        }
    }

    acquireNewTarget = (target) => {
        this.target = target;

        // compute bounding box to get visual center and size
        const box = new THREE.Box3().setFromObject(target);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        // position goal relative to the visual center
        // distance scales with the largest dimension of the ship
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 0.8;

        this.goal = new THREE.Object3D();
        target.add(this.goal);

        // offset goal from the visual center in local space
        const localCenter = center.clone().sub(target.position);
        this.goal.position.set(
            localCenter.x,
            localCenter.y + size.y * 0.1,
            localCenter.z + distance
        );

        this.setCameraPositionRelativeToMeshAndFollow(this.camera, target);
    };

    getCurrentTarget = () => {
        return this.target;
    }

    clearTarget = () => {
        this.target = null;
    }

    setCameraPositionRelativeToMeshAndFollow = (camera, mesh) => {
        const temp = new THREE.Vector3();
        temp.setFromMatrixPosition(this.goal.matrixWorld);
        camera.position.lerp(temp, .2);

        // use Box3 center for large models like the ISD
        // so the camera looks at the visual center not the group pivot
        const box = new THREE.Box3().setFromObject(mesh);
        const center = new THREE.Vector3();
        box.getCenter(center);

        camera.lookAt(center);
    };

    update = () => {
        if(this.camera && this.target){
            this.setCameraPositionRelativeToMeshAndFollow(this.camera, this.target);
        }
    };
}