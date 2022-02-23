import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

export default (gameObjMesh, config, command, direction, collisionManager, audio, laser) => {
    let collision = false;
    if(command === "patrol") {
        // if its patrol move the gameObj around a specific route
        config.direction = direction;
        collision = moveObject(gameObjMesh, config, collisionManager, audio);

    } else if(command === "turnAround") {
        rotate(gameObjMesh, Math.PI, "y", 200, config);
    } else if(command === "fire") {
        fireWeapon(gameObjMesh, config, laser);
    }
    return collision;
}

/**
 * moveObject
 * moves game object forward
 * @param mesh
 * @param config
 * @param collisionManager
 * @param audio
 */
function moveObject(mesh, config, collisionManager, audio) {
    if(config.fsm){
        // console.log(`moveObject: ${mesh.name}`);
        // console.log(`position x:${mesh.position.x}, y:${mesh.position.y}, z:${mesh.position.z}`)

        const matrix = new THREE.Matrix4();
        matrix.extractRotation( mesh.matrix );
        let directionVector;

        directionVector = new THREE.Vector3( 0, 0, 1 );
        directionVector.applyMatrix4(matrix);

            // audio.playSound(mesh, "FLYBY");
        const direction = -1;
        const stepVector = directionVector.multiplyScalar( config.speed * direction );
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
 * fireWeapon
 * @param mesh
 * @param config
 * @param laser
 */
function fireWeapon(mesh, config, laser) {
    if(!config.weapons.firing){
        config.weapons.firing = true;
        laser.fire(mesh, 2, mesh.faction);
        config.weapons.firing = false;
    }
}

/**
 * rotate
 * rotate game object
 * @param mesh
 * @param angle
 * @param axis
 * @param duration
 * @param config
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
            .onComplete( () => config.rotation.rotating = false)
            .start();
    }
}
