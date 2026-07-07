import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

export default (scene, gameObjMesh, config, command, direction, collisionManager, audio, laser, target) => {
    let collision = false;

    if(command === "patrol") {
        config.direction = direction;
        collision = moveObject(gameObjMesh, config, collisionManager, audio);
    } else if(command === "turnAround") {
        rotate(gameObjMesh, Math.PI, "y", 200, config);
    } else if(command === "fire") {
        fireWeapon(gameObjMesh, config, laser);
    } else if(command === "burstFire") {
        // `target`, when supplied, is a () => boolean re-aim check run before
        // each shot in the burst — without it, a burst keeps firing on its
        // 300ms timer even after the ship has turned away mid-burst
        burstFire(gameObjMesh, config, laser, target);
    } else if(command === "moveToward") {
        collision = moveToward(gameObjMesh, config, target, collisionManager);
    } else if(command === "lookAtTarget") {
        lookAtTarget(gameObjMesh, target, config);
    } else if(command === "moveForward") {
        collision = moveForward(gameObjMesh, config, collisionManager);
    }  else if(command === "flightUpdate") {
        collision = flightUpdate(gameObjMesh, config, target, collisionManager);
    }

    return collision;
}

/**
 * moveObject
 * original patrol movement — moves forward along facing direction
 */
function moveObject(mesh, config, collisionManager, audio) {
    if(mesh.name === "Y_WING" || mesh.name === "SHUTTLE"){
        const matrix = new THREE.Matrix4();
        matrix.extractRotation(mesh.matrix);
        const directionVector = new THREE.Vector3(0, 0, 1);
        directionVector.applyMatrix4(matrix);

        const direction = -1;
        const stepVector = directionVector.multiplyScalar(config.speed * direction);
        const tPosition = mesh.position.clone().add(stepVector);
        let collision = false;
        if(collisionManager){
            collision = collisionManager.checkCollision({ position: tPosition, name: mesh.name });
        }
        if(!collision){
            mesh.position.add(stepVector);
        }
        return collision;
    }
}

/**
 * moveForward
 * moves any mesh forward along its current facing direction
 */
function moveForward(mesh, config, collisionManager) {
    const matrix = new THREE.Matrix4();
    matrix.extractRotation(mesh.matrix);
    const directionVector = new THREE.Vector3(0, 0, -1);
    directionVector.applyMatrix4(matrix);

    const stepVector = directionVector.multiplyScalar(config.speed);
    const tPosition = mesh.position.clone().add(stepVector);
    let collision = false;
    if(collisionManager){
        collision = collisionManager.checkCollision({ position: tPosition, name: mesh.name });
    }
    if(!collision){
        mesh.position.add(stepVector);
    }
    return collision;
}

/**
 * moveToward
 * steers the mesh toward a world-space position or mesh
 */
function moveToward(mesh, config, target, collisionManager) {
    if(!target) return false;

    const targetPos = target.isVector3 ? target : target.position.clone();

    // step toward target
    const direction = new THREE.Vector3()
        .subVectors(targetPos, mesh.position)
        .normalize();

    const stepVector = direction.multiplyScalar(config.speed);
    const tPosition = mesh.position.clone().add(stepVector);

    let collision = false;
    if(collisionManager){
        collision = collisionManager.checkCollision({ position: tPosition, name: mesh.name });
    }
    if(!collision){
        mesh.position.add(stepVector);
    }
    return collision;
}

/**
 * flightUpdate
 * physically-based flight with momentum and visual banking.
 * Call every frame — updates velocity, rotation and position in one step.
 *
 * Expects config.flight to be initialised (done automatically on first call).
 */
function flightUpdate(mesh, config, target, collisionManager) {
    if(!target) return false;

    // initialise flight state on first call
    if(!config.flight) {
        // start velocity along current mesh facing direction
        const initMatrix = new THREE.Matrix4().extractRotation(mesh.matrix);
        const initForward = new THREE.Vector3(0, 0, 1).applyMatrix4(initMatrix);
        config.flight = {
            velocity: initForward.multiplyScalar(config.speed),
            currentBank: 0,
        };
    }

    const f = config.flight;
    const targetPos = target.isVector3 ? target : target.position.clone();

    // desired direction toward target
    const desired = new THREE.Vector3()
        .subVectors(targetPos, mesh.position)
        .normalize();

    // agility is derived from the ship's rollSpeed — the same per-ship-type value
    // FlyControls uses for the player — so an AI-flown ship steers/banks/accelerates
    // at a rate consistent with how the player would fly that same craft.
    const BASE_ROLL_SPEED = 0.009;
    const agility   = (config.rollSpeed || BASE_ROLL_SPEED) / BASE_ROLL_SPEED;

    const TURN_RATE  = config.turnRate || 0.006 * agility; // wide sweeping arcs, scaled by agility
    const BANK_RATE  = 0.05 * agility;
    const MAX_BANK   = THREE.MathUtils.clamp(0.4 * agility, 0.2, 0.6);
    const ACCEL_RATE = 0.02 * agility;
    const SPEED      = config.speed;

    // gently steer velocity toward desired direction
    const newVelocity = f.velocity.clone().lerp(
        desired.clone().multiplyScalar(SPEED),
        TURN_RATE
    );
    const currentLen = newVelocity.length();
    const targetLen = THREE.MathUtils.lerp(currentLen, SPEED, ACCEL_RATE); // gradual acceleration
    newVelocity.setLength(Math.min(targetLen, SPEED));
    f.velocity.copy(newVelocity);

    // derive yaw from velocity — use (x, z) components
    const flatVelocity = new THREE.Vector3(f.velocity.x, 0, f.velocity.z);
    // derive yaw from velocity — add Math.PI to flip model to face forward
    if(flatVelocity.length() > 0.001) {
        mesh.rotation.y = Math.atan2(f.velocity.x, f.velocity.z) + Math.PI;
    }

    // gentle pitch from vertical velocity component
    mesh.rotation.x = THREE.MathUtils.clamp(
        -f.velocity.y / SPEED * 0.4,
        -0.3,
        0.3
    );

    // banking — cross product of old forward and new velocity direction
    const oldForward = new THREE.Vector3(0, 0, 1)
        .applyMatrix4(new THREE.Matrix4().extractRotation(mesh.matrix));
    const cross = new THREE.Vector3().crossVectors(oldForward, f.velocity.clone().normalize());
    const targetBank = cross.y * MAX_BANK * 3;
    f.currentBank += (targetBank - f.currentBank) * BANK_RATE;
    f.currentBank = THREE.MathUtils.clamp(f.currentBank, -MAX_BANK, MAX_BANK);
    mesh.rotation.z = f.currentBank;

    // move
    const tPosition = mesh.position.clone().add(f.velocity);
    let collision = false;
    if(collisionManager) {
        collision = collisionManager.checkCollision({ position: tPosition, name: mesh.name });
    }
    if(!collision) {
        mesh.position.add(f.velocity);
    }

    return collision;
}



/**
 * lookAtTarget
 * smoothly rotates mesh to face a target position or mesh
 */
function lookAtTarget(mesh, target, config) {
    if(!target) return;
    if(config.rotation && config.rotation.rotating) return;

    const targetPos = target.isVector3 ? target : target.position.clone();

    // get the angle to the target on the Y axis
    const direction = new THREE.Vector3()
        .subVectors(targetPos, mesh.position)
        .normalize();

    const targetAngle = Math.atan2(direction.x, direction.z);
    const currentAngle = mesh.rotation.y;
    const diff = targetAngle - currentAngle;

    // only tween if the difference is significant
    if(Math.abs(diff) > 0.05) {
        if(config.rotation) config.rotation.rotating = true;
        new TWEEN.Tween(mesh.rotation)
            .to({ y: targetAngle }, 800)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onComplete(() => {
                if(config.rotation) config.rotation.rotating = false;
            })
            .start();
    }
}

/**
 * fireWeapon
 * single shot fire
 */
function fireWeapon(mesh, config, laser) {
    if(!config.weapons.firing){
        config.weapons.firing = true;
        laser.fire(mesh, 2, mesh.faction);
        config.weapons.firing = false;
    }
}

/**
 * burstFire
 * fires a burst of shots with a cooldown between bursts
 */
function burstFire(mesh, config, laser, canFireNow) {
    if(!laser) return;

    // initialise burst state on config if not present
    if(config.weapons.burstCooldown === undefined) {
        config.weapons.burstCooldown = 0;
        config.weapons.burstCount = 0;
        config.weapons.inBurst = false;
    }

    const now = Date.now();

    if(!config.weapons.inBurst && now > config.weapons.burstCooldown) {
        // start a new burst — fire 3 shots 300ms apart
        config.weapons.inBurst = true;
        config.weapons.burstCount = 0;

        // fire the first shot immediately — setInterval doesn't invoke its
        // callback until after the first 300ms delay, which was letting a
        // fast-moving fighter fly past the target before even the first
        // shot of the burst went out
        laser.fire(mesh, 2, mesh.faction);
        config.weapons.burstCount++;

        const burstInterval = setInterval(() => {
            if(mesh.hull <= 0) {
                clearInterval(burstInterval);
                config.weapons.inBurst = false;
                return;
            }

            // the ship may have turned away since the burst started (e.g.
            // banking off toward an egress waypoint) — bail out rather than
            // firing the remaining shots off into space
            if(canFireNow && !canFireNow()) {
                clearInterval(burstInterval);
                config.weapons.inBurst = false;
                // short retry cooldown so it can resume firing as soon as it
                // lines back up, instead of waiting the full burst cooldown
                config.weapons.burstCooldown = Date.now() + 300;
                return;
            }

            laser.fire(mesh, 2, mesh.faction);
            config.weapons.burstCount++;
            if(config.weapons.burstCount >= 3) {
                clearInterval(burstInterval);
                config.weapons.inBurst = false;
                // cooldown 2-4 seconds between bursts for variety
                config.weapons.burstCooldown = now + 2000 + Math.random() * 2000;
            }
        }, 300);
    }
}

/**
 * rotate
 * rotate game object by angle on axis
 */
function rotate(mesh, angle, axis = "y", duration = 300, config) {
    duration -= 50;
    let finalAngle;
    let tweenObj;
    if(!config.rotation.rotating) {
        if(axis === "y"){
            finalAngle = mesh.rotation.y + angle;
            tweenObj = { y: finalAngle };
        } else if(axis === "x") {
            finalAngle = mesh.rotation.x + angle;
            tweenObj = { x: finalAngle };
        } else if(axis === "z") {
            finalAngle = mesh.rotation.z + angle;
            tweenObj = { z: finalAngle };
        }
        config.rotation.rotating = true;
        new TWEEN.Tween(mesh.rotation)
            .to(tweenObj, duration)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onComplete(() => config.rotation.rotating = false)
            .start();
    }
}