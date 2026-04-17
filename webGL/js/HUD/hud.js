import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import EventBus from "../eventBus/EventBus.js";
import events from "../eventBus/events.js";

const SEGMENT_COUNT = 10;

function updateBar(barId, current, max) {
    const bar = document.getElementById(barId);
    if (!bar) return;

    const segments = bar.querySelectorAll('.segment');
    const activePct = max > 0 ? current / max : 0;
    const activeCount = Math.ceil(activePct * SEGMENT_COUNT);

    // flash animation - remove and re-add class to retrigger
    bar.classList.remove('hit');
    void bar.offsetWidth; // force reflow so animation restarts
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
    // seed bars with starting values from config on game start
    updateBar('shield-bar', playerConfig.shields, playerConfig.shields);
    updateBar('hull-bar', playerConfig.hull, playerConfig.hull);

    // subscribe here so it only activates once the HUD is actually initialised
    EventBus.subscribe(events.PLAYER_DAMAGED, ({ shields, maxShields, hull, maxHull }) => {
        updateBar('shield-bar', shields, maxShields);
        updateBar('hull-bar', hull, maxHull);
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