// import * as THREE from '../../node_modules/three/build/three.module.js'
import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import eventBus from "../eventBus/EventBus.js";
import eventBusEvents from "../eventBus/events.js";
export default (mesh, laser, camera, config, collisionManager, audio) => {

	const keycodes = {
        W: 87,
        A: 65,
        S: 83,
        D: 68,
        R: 82,
        F: 70,
        Q: 81,
        E: 69,
        V: 86,
        B: 66,
        SPACE: 32
    };

    let forward = false;
    let backward = false;
    let rotating = false;

    setCameraPositionRelativeToMesh(camera, mesh, config);

	function onKeyDown(keyCode, duration) {
        if(keyCode === keycodes.W)
            forward = true;
        else if(keyCode === keycodes.S)
            backward = true;
        // pitch
        else if(keyCode === keycodes.V) {
            rotate(-Math.PI/2,"x", duration);
        }
        else if(keyCode === keycodes.B) {
            rotate(Math.PI/2, "x", duration);
        }
        // rotate
        else if(keyCode === keycodes.E) {
            rotate(-Math.PI/2,"z", 200);
        }
        else if(keyCode === keycodes.Q) {
            rotate(Math.PI/2, "z", 200);
        }
        // rotate 90 degrees
        else if(keyCode === keycodes.D) {
            rotate(-Math.PI/2, duration);
        }

        else if(keyCode === keycodes.A) {
            rotate(Math.PI/2, duration);
        }

        // space fire cannons
        else if(keyCode === keycodes.SPACE) {
            fireCannons(mesh);
        }

    }

    function fireCannons(mesh) {
        // move / translate them on the game world
        laser.fire(mesh, 2, mesh.name === "PLAYER2" ? "REBELLION" : "IMPERIAL");
        // collision for lazers
    }

    function onKeyUp(keyCode) {
        if(keyCode === keycodes.W)
            forward = false;
        else if(keyCode === keycodes.S)
            backward = false;
    }

    function rotate(angle, axis = "y", duration = 300) {
        duration -= 50;
        let finalAngle;
        let tweenObj;
        if(rotating)
            return;

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

        rotating = true;
        new TWEEN.Tween(mesh.rotation)
            .to(tweenObj, duration)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onComplete( () => rotating = false)
            .start();
        updateServer(mesh, "PLAYER");
    }

    function updateServer(mesh, type){
        eventBus.post(eventBusEvents.GAME_STATE, {
            position: mesh.position,
            rotation: mesh.rotation,
            scale: mesh.scale,
            type,
        });
    }

    function update(time) {
        const matrix = new THREE.Matrix4();
        matrix.extractRotation( mesh.matrix );
        let directionVector;
        if(config.playerName === "PLAYER2"){
            directionVector = new THREE.Vector3( 0, 0, -1 );
            directionVector.applyMatrix4(matrix);
        } else {
            directionVector = new THREE.Vector3( 0, 0, 1 );
            directionVector.applyMatrix4(matrix);
        }

		if(forward || backward) {
            audio.playSound(mesh, "FLYBY");
            const direction = backward ? 1 : -1;
            const stepVector = directionVector.multiplyScalar( config.speed * direction );
            const tPosition = mesh.position.clone().add(stepVector);

            const collision = collisionManager.checkCollision({ position: tPosition, name:'PLAYER' });

            if(!collision) {
                mesh.position.add(stepVector);
                camera.position.add(stepVector);
                // update Server with position
                updateServer(mesh, "PLAYER");
            }
        } else
            collisionManager.checkCollision({ position: mesh.position, name:'PLAYER' });
    }

    function resetPosition() {
        mesh.position.x = config.position.x;
        mesh.position.y = config.position.y;
        mesh.position.z = config.position.z;
        mesh.scale.x = config.scale;
        mesh.scale.z = config.scale;
        mesh.scale.y = config.scale;

        setCameraPositionRelativeToMesh(camera, mesh, config);
    }

    function setCameraPositionRelativeToMesh(camera, mesh, config) {
	    if(config.playerName === "PLAYER1"){
            camera.position.x = mesh.position.x;
            camera.position.z = mesh.position.z + 20;
            camera.position.y = mesh.position.y + 5;
            console.log(`${config.name}: camera position: ${JSON.stringify(camera.position)}`);
            camera.lookAt(new THREE.Vector3(mesh.position.x, mesh.position.y, mesh.position.z));
        } else if (config.playerName === "PLAYER2") {
            camera.position.x = mesh.position.x;
            camera.position.z = mesh.position.z - 20;
            camera.position.y = mesh.position.y + 5;
            console.log(`${config.name}: camera position: ${JSON.stringify(camera.position)}`);
            camera.lookAt(new THREE.Vector3(mesh.position.x, mesh.position.y, mesh.position.z));
        } else {
	        // spectator camera
            camera.position.x = 0;
            camera.position.z = 0;
            camera.position.y = 100;
            console.log(`spectate camera position: ${JSON.stringify(camera.position)}`);
            camera.lookAt(new THREE.Vector3(0, 0, 0));
        }
    }

	return {
        resetPosition,
		onKeyDown,
		onKeyUp,
		update
	}
}
