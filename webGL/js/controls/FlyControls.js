/**
 * @author James Baicoianu / http://www.baicoianu.com/
 */
import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import eventBus from "../eventBus/EventBus.js";
import eventBusEvents from "../eventBus/events.js";
import WeaponsEnergy from "./WeaponsEnergy.js";

function bind( scope, fn ) {
    return function () {
        fn.apply( scope, arguments );
    };
}

function contextmenu( event ) {
    event.preventDefault();
}

export default class FlyControls {

    constructor(object, camera, domElement, collisionManager, laser, audio, config, ships, hud) {
        this.ships = ships;
        this.hud = hud;
        this.config = config;
        this.object = object;
        this.camera = camera;
        this.laser = laser;
        this.audio = audio;
        this.throttle = 0;
        this.updateThrottleReadout();
        this.collisionManager = collisionManager;
        this.dockingManager = null;
        this.weaponsEnergy = WeaponsEnergy({ rechargeRate: object.laserRechargeRate });
        this._lastEnergyTick = null;
        eventBus.post(eventBusEvents.WEAPON_ENERGY_CHANGED, {
            energy: this.weaponsEnergy.getEnergy(),
            maxEnergy: this.weaponsEnergy.getMaxEnergy(),
        });
        this.goal = new THREE.Object3D();
        object.add( this.goal );
        this.goal.position.set(0, 5, 20);
        this.setCameraPositionRelativeToMeshAndFollow(this.camera, object);
        this.domElement = (domElement !== undefined) ? domElement : document;
        if (domElement) this.domElement.setAttribute('tabindex', -1);
        // API

        this.rollSpeed = config.rollSpeed;
        this.dragToLook = true;
        this.autoForward = false;

        // disable default target object behavior

        // internals

        this.tmpQuaternion = new THREE.Quaternion();

        this.mouseStatus = 0;

        this.moveState = {
            forward: 0,
            back: 0,
            pitchDown: 0,
            yawLeft: 0,
            rollLeft: 0,
            rollRight: 0
        };
        this.moveVector = new THREE.Vector3(0, 0, 0);
        this.rotationVector = new THREE.Vector3(0, 0, 0);

        // stop the targeting computer from tracking ships after they're destroyed —
        // `this.ships` is a snapshot built once at scene load, so without this it keeps
        // cycling to (and locking onto) meshes that have already been removed from the scene
        eventBus.subscribe(eventBusEvents.SHIP_DESTROYED, ({ userId: destroyedUserId, designation: destroyedDesignation }) => {
            const idx = this.ships.findIndex(ship =>
                (destroyedUserId !== undefined && ship.userId === destroyedUserId) ||
                (destroyedDesignation !== undefined && ship.designation === destroyedDesignation)
            );
            if (idx === -1) return;

            const destroyedMesh = this.ships[idx];
            this.ships.splice(idx, 1);

            if (this.hud && this.hud.getCurrentTarget() === destroyedMesh) {
                const nextTarget = this.ships[this.ships.length - 1] || null;
                if (nextTarget) {
                    this.hud.acquireNewTarget(nextTarget);
                    eventBus.post(eventBusEvents.TARGET_CHANGED, {
                        mesh: nextTarget,
                        shields: nextTarget.shields,
                        maxShields: nextTarget.maxShields,
                        hull: nextTarget.hull,
                        maxHull: nextTarget.maxHull,
                        name: nextTarget.name,
                        designation: nextTarget.designation,
                        userId: nextTarget.userId,
                        speed: nextTarget.speed,
                        identified: nextTarget.identified,
                        faction: nextTarget.faction,
                        cargo: nextTarget.cargo,
                    });
                } else {
                    this.hud.clearTarget();
                    eventBus.post(eventBusEvents.TARGET_CHANGED, { mesh: null });
                }
            }
        });

        const _mousemove = bind( this, this.mousemove );
        const _mousedown = bind( this, this.mousedown );
        const _mouseup = bind( this, this.mouseup );
        const _onKeyDown = bind( this, this.onKeyDown );
        const _onKeyUp = bind( this, this.onKeyUp );

        this.domElement.addEventListener( 'contextmenu', contextmenu, false );
        this.domElement.addEventListener( 'mousemove', _mousemove, false );
        this.domElement.addEventListener( 'mousedown', _mousedown, false );
        this.domElement.addEventListener( 'mouseup',   _mouseup, false );

        window.addEventListener( 'onKeyDown', _onKeyDown, false );
        window.addEventListener( 'onKeyUp',   _onKeyUp, false );
    }

    setCameraPositionRelativeToMeshAndFollow = function(camera, mesh) {
        const temp = new THREE.Vector3();
        temp.setFromMatrixPosition(this.goal.matrixWorld);
        camera.position.lerp(temp, .2);
        camera.lookAt( mesh.position );
    };

    updateMovementVector = function() {
        const forward = ( this.moveState.forward || ( this.autoForward && ! this.moveState.back ) ) ? 1 : 0;
        this.moveVector.z = ( - forward + this.moveState.back );
    };
    updateRotationVector = function() {
        this.rotationVector.x = - this.moveState.pitchDown;
        this.rotationVector.y = this.moveState.yawLeft;
        this.rotationVector.z = ( - this.moveState.rollRight + this.moveState.rollLeft );
    };

    updateThrottleReadout = () => {
        const throttleEl = document.getElementById('throttle-readout');
        const speedEl = document.getElementById('speed-readout');
        if(throttleEl) {
            const pct = this.config.speed > 0 ? (parseFloat(this.throttle) / this.config.speed) * 100 : 0;
            throttleEl.textContent = `${Math.round(pct)}%`;
        }
        if(speedEl) speedEl.textContent = parseFloat(this.throttle).toFixed(1);
    };

    throttleDown = () => {
        if(parseFloat(this.throttle) > 0){
            this.throttle = (parseFloat(this.throttle) - 0.1).toFixed(1);
        }
        this.updateThrottleReadout();
    };

    throttleUp = () => {
        if(parseFloat(this.throttle) < this.config.speed){
            this.throttle = (parseFloat(this.throttle) + 0.1).toFixed(1);
        }
        this.updateThrottleReadout();
    };

    onKeyDown = function( keyCode ) {
        switch ( keyCode ) {

            case 16: /* shift */ this.movementSpeedMultiplier = .1; break;

            case 87: /*W*/ this.throttleUp(); break;
            case 83: /*S*/ this.throttleDown(); break;

            case 81: /*Q*/ this.moveState.rollLeft = 1; break;
            case 69: /*E*/ this.moveState.rollRight = 1; break;
            case 187: /*+/=*/
                this.throttleUp();
                break;
            case 189: /*-*/
                this.throttleDown();
                break;
            case 84: this.acquireTarget(); break;
            case 71: /*G*/ if(this.dockingManager) this.dockingManager.attemptDock(); break;

        }

        this.updateMovementVector();
        this.updateRotationVector();

    };
    onKeyUp = function( keyCode ) {
        switch ( keyCode ) {

            case 16: /* shift */ this.movementSpeedMultiplier = 1; break;

            case 87: /*W*/  break;
            case 83: /*S*/  break;

            case 81: /*Q*/ this.moveState.rollLeft = 0; break;
            case 69: /*E*/ this.moveState.rollRight = 0; break;

        }

        this.updateMovementVector();
        this.updateRotationVector();

    };
    mousedown = function( event ) {

        if ( this.domElement !== document ) {

            this.domElement.focus();

        }

        event.preventDefault();
        event.stopPropagation();

        if ( this.dragToLook ) {

            this.mouseStatus ++;

        } else {
            switch ( event.button ) {

                case 0: this.moveState.forward = 1; break;
                case 2: this.moveState.back = 1; break;

            }

            this.updateMovementVector();
        }
        this.fireCannons(this.object);
    };
    mousemove = function( event ) {
        if ( ! this.dragToLook || this.mouseStatus > 0 ) {
            const container = this.getContainerDimensions();

            const halfWidth  = container.size[ 0 ] / 2;
            const halfHeight = container.size[ 1 ] / 2;
            // console.log(`container: halfWidth: ${halfWidth}, halfHeight: ${halfHeight}`);
            this.moveState.yawLeft   = - ( ( event.pageX - container.offset[ 0 ] ) - halfWidth  ) / halfWidth;
            this.moveState.pitchDown =   ( ( event.pageY - container.offset[ 1 ] ) - halfHeight ) / halfHeight;
            // console.log(`yawLeft: ${this.moveState.yawLeft}, pitchDown: ${this.moveState.pitchDown}`);
            this.updateRotationVector();

        }

    };
    mouseup = function( event ) {
        event.preventDefault();
        event.stopPropagation();

        if ( this.dragToLook ) {

            this.mouseStatus --;

            this.moveState.yawLeft = this.moveState.pitchDown = 0;

        } else {

            switch ( event.button ) {

                case 0: this.moveState.forward = 0; break;
                case 2: this.moveState.back = 0; break;

            }

            this.updateMovementVector();

        }

        this.updateRotationVector();

    };

    acquireTarget = () => {
        if(this.ships.length > -1){
            const currentTargetIndex = this.ships.indexOf(this.hud.getCurrentTarget());
            let nextTargetIndex = this.ships.indexOf(this.ships[currentTargetIndex-1]);
            const target = this.ships[nextTargetIndex] || this.ships[this.ships.length - 1];
            console.log(`target - userId: ${target.userId}, hull: ${target.hull}, maxHull: ${target.maxHull}, shields: ${target.shields}, maxShields: ${target.maxShields}`);
            if( nextTargetIndex >= 0 ) {
                this.hud.acquireNewTarget(this.ships[nextTargetIndex]);
                console.log(`Acquire Target: ${nextTargetIndex}:  ${this.ships[nextTargetIndex].designation}, ${this.ships[nextTargetIndex].name}`);
                eventBus.post(eventBusEvents.TARGET_CHANGED, {
                    mesh: this.ships[nextTargetIndex],        // <-- ADD THIS
                    shields: this.ships[nextTargetIndex].shields,
                    maxShields: this.ships[nextTargetIndex].maxShields,
                    hull: this.ships[nextTargetIndex].hull,
                    maxHull: this.ships[nextTargetIndex].maxHull,
                    name: this.ships[nextTargetIndex].name,
                    designation: this.ships[nextTargetIndex].designation,
                    userId: this.ships[nextTargetIndex].userId,  // add this
                    speed: this.ships[nextTargetIndex].speed,
                    identified: this.ships[nextTargetIndex].identified,
                    faction: this.ships[nextTargetIndex].faction,
                    cargo: this.ships[nextTargetIndex].cargo,
                });
            } else {
                nextTargetIndex = this.ships.length - 1;
                if(nextTargetIndex > -1){
                    let nextTarget = this.ships[nextTargetIndex];
                    console.log(`Acquire Target: ${nextTargetIndex}:  ${nextTarget.designation}, ${nextTarget.name}`);
                    this.hud.acquireNewTarget(nextTarget);
                    eventBus.post(eventBusEvents.TARGET_CHANGED, {
                        mesh: nextTarget,                         // <-- ADD THIS
                        shields: nextTarget.shields,
                        maxShields: nextTarget.maxShields,
                        hull: nextTarget.hull,
                        maxHull: nextTarget.maxHull,
                        name: nextTarget.name,
                        designation: nextTarget.designation,
                        userId: nextTarget.userId,  // add this
                        speed: nextTarget.speed,
                        identified: nextTarget.identified,
                        faction: nextTarget.faction,
                        cargo: nextTarget.cargo,
                    });
                }
            }
        }
    };

    fireCannons = function(mesh) {
        if(mesh.hull <= 0) return;  // add this guard
        if(!this.weaponsEnergy.trySpend()) return;  // recharging — can't fire yet
        // move / translate them on the game world
        // console.log(`firing lasers`);
        this.laser.fire(mesh, 2, mesh.faction);
        this.updateServer(mesh,"LASERS");
        eventBus.post(eventBusEvents.WEAPON_ENERGY_CHANGED, {
            energy: this.weaponsEnergy.getEnergy(),
            maxEnergy: this.weaponsEnergy.getMaxEnergy(),
        });
        // collision for lazers
    };

    updateServer = function(mesh, type){
        eventBus.post(eventBusEvents.GAME_STATE, {
            position: mesh.position,
            rotation: mesh.rotation,
            scale: mesh.scale,
            type,
        });
    };

    update = function( elapsedTime ) {
        if(this.object.hull <= 0) return;

        // SceneManager calls update() with total elapsed time, not a per-frame
        // delta, so derive the delta here for the recharge-rate math
        const energyDt = (this._lastEnergyTick === null) ? 0 : Math.max(0, elapsedTime - this._lastEnergyTick);
        this._lastEnergyTick = elapsedTime;
        if (this.weaponsEnergy.update(energyDt)) {
            eventBus.post(eventBusEvents.WEAPON_ENERGY_CHANGED, {
                energy: this.weaponsEnergy.getEnergy(),
                maxEnergy: this.weaponsEnergy.getMaxEnergy(),
            });
        }

        const matrix = new THREE.Matrix4();
        matrix.extractRotation( this.object.matrix );

        const directionVector = new THREE.Vector3( 0, 0, 1 );
        directionVector.applyMatrix4(matrix);
        // console.log(`delta: ${delta}`);
        const moveMult = this.throttle;
        const rotMult = this.rollSpeed;

        // console.log(`rotMult: ${rotMult}`);
        const direction = this.moveState.back ? 1 : -1;
        const stepVector = directionVector.multiplyScalar( this.throttle * direction );
        const tPosition = this.object.position.clone().add(stepVector);
        const collision = this.collisionManager.checkCollision({
            position: tPosition,
            name: 'Player'
        });
        if(!collision){
            this.autoForward = true;
            this.object.translateZ( this.moveVector.z * moveMult );
            if(this.moveState.forward === 1) {
                let flyType = "FLYBY";
                if(this.object.faction === "REBELLION"){
                    flyType = "REBEL_FLYBY";
                }
                this.audio.playSound(flyType, this.object);
            }
            this.updateServer(this.object, "PLAYER");
        } else {
            this.autoForward = false;
        }

        this.tmpQuaternion.set( this.rotationVector.x * rotMult, this.rotationVector.y * rotMult, this.rotationVector.z * rotMult, 1 ).normalize();
        this.object.quaternion.multiply( this.tmpQuaternion );

        // expose the rotation vector for convenience
        this.object.rotation.setFromQuaternion( this.object.quaternion, this.object.rotation.order );
        this.camera.rotation.setFromQuaternion( this.object.quaternion, this.object.rotation.order );

        this.setCameraPositionRelativeToMeshAndFollow(this.camera, this.object);
    };

    getContainerDimensions = function() {
        let containerDimensions = {
            size	: [ window.innerWidth, window.innerHeight ],
            offset	: [ 0, 0 ]
        };

        if ( this.domElement != document ) {
            containerDimensions = {
                size	: [ this.domElement.offsetWidth, this.domElement.offsetHeight ],
                    offset	: [ this.domElement.offsetLeft,  this.domElement.offsetTop ]
            };

        }

        return containerDimensions;
    };
    dispose = function() {

        this.domElement.removeEventListener( 'contextmenu', contextmenu, false );
        this.domElement.removeEventListener( 'mousedown', _mousedown, false );
        this.domElement.removeEventListener( 'mousemove', _mousemove, false );
        this.domElement.removeEventListener( 'mouseup', _mouseup, false );

        window.removeEventListener( 'onKeyDown', _onKeyDown, false );
        window.removeEventListener( 'onKeyUp', _onKeyUp, false );

    };

    resetPosition = function() {
        this.object.position.x = this.config.position.x;
        this.object.position.y = this.config.position.y;
        this.object.position.z = this.config.position.z;
        this.object.scale.x = this.config.scale;
        this.object.scale.z = this.config.scale;
        this.object.scale.y = this.config.scale;

        this.setCameraPositionRelativeToMeshAndFollow(this.camera, this.object);
    }
}





