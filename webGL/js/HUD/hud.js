import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import EventBus from "../eventBus/EventBus.js";
import events from "../eventBus/events.js";

const SEGMENT_COUNT = 10;

export function updateBar(barId, current, max) {
    const bar = document.getElementById(barId);
    if (!bar) return;

    const segments = bar.querySelectorAll('.segment');
    const activePct = max > 0 ? current / max : 0;
    const activeCount = Math.ceil(activePct * SEGMENT_COUNT);

    bar.classList.remove('hit');
    void bar.offsetWidth;
    bar.classList.add('hit');

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

export function initHUD(playerConfig) {
    updateBar('shield-bar', playerConfig.shields, playerConfig.shields);
    updateBar('hull-bar', playerConfig.hull, playerConfig.hull);

    EventBus.subscribe(events.PLAYER_DAMAGED, ({ shields, maxShields, hull, maxHull }) => {
        updateBar('shield-bar', shields, maxShields);
        updateBar('hull-bar', hull, maxHull);
    });

    // userId is now destructured from the event payload
    EventBus.subscribe(events.TARGET_CHANGED, ({ shields, maxShields, hull, maxHull, name, designation, userId }) => {
        const nameEl = document.getElementById('target-name');
        if(nameEl) {
            nameEl.textContent = designation || name || userId;
            nameEl.dataset.targetUserId = userId || designation;
        }
        updateBar('target-shield-bar', shields, maxShields);
        updateBar('target-hull-bar', hull, maxHull);
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
        if(target){
            this.camera = camera;
            this.target = target;
            this.goal = new THREE.Object3D();
            target.add( this.goal );
            this.goal.position.set(0, 5, 20);
            this.setCameraPositionRelativeToMeshAndFollow(this.camera, target);
        }
    }

    acquireNewTarget = (target) => {
        this.target = target;
        this.goal = new THREE.Object3D();
        target.add( this.goal );
        this.goal.position.set(0, 5, 20);
        this.setCameraPositionRelativeToMeshAndFollow(this.camera, target);
    };

    getCurrentTarget = () => {
        return this.target;
    }

    setCameraPositionRelativeToMeshAndFollow = (camera, mesh) => {
        const temp = new THREE.Vector3();
        temp.setFromMatrixPosition(this.goal.matrixWorld);
        camera.position.lerp(temp, .2);
        camera.lookAt( mesh.position );
    };

    update = () => {
        if(this.camera && this.target){
            this.setCameraPositionRelativeToMeshAndFollow(this.camera, this.target);
        }
    };
}