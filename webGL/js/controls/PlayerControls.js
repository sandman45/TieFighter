import * as THREE from '../../node_modules/three/build/three.module.js'

export default (mesh, laser, camera, config, collisionManager) => {

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

    setCameraPositionRelativeToMesh(camera, mesh);

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
        laser.fire(mesh, 2);
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
            .start()
    }

    function update(time) {
        const matrix = new THREE.Matrix4();
        matrix.extractRotation( mesh.matrix );

        const directionVector = new THREE.Vector3( 0, 0, 1 );
        directionVector.applyMatrix4(matrix);

		if(forward || backward) {
            const direction = backward ? 1 : -1;
            const stepVector = directionVector.multiplyScalar( config.speed * direction );
            const tPosition = mesh.position.clone().add(stepVector);

            const collision = collisionManager.checkCollision({ position: tPosition, name:'Player' });

            if(!collision) {
                mesh.position.add(stepVector);
                camera.position.add(stepVector);
             }
        } else
            collisionManager.checkCollision(mesh.position);
    }

    function resetPosition() {
        mesh.position.x = config.position.x;
        mesh.position.y = config.position.y;
        mesh.position.z = config.position.z;
        mesh.scale.x = config.scale;
        mesh.scale.z = config.scale;
        mesh.scale.y = config.scale;

        setCameraPositionRelativeToMesh(camera, mesh);
    }

    function setCameraPositionRelativeToMesh(camera, mesh) {
        camera.position.x = mesh.position.x;
        camera.position.z = mesh.position.z + 20;
        camera.position.y = mesh.position.y + 5;
        console.log(`after camera position z: ${camera.position.z}`);
        camera.lookAt(new THREE.Vector3(mesh.position.x, mesh.position.y, mesh.position.z));
    }

	return {
        resetPosition,
		onKeyDown,
		onKeyUp,
		update
	}
}
