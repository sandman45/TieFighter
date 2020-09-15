import * as THREE from '../../../node_modules/three/build/three.module.js'

export default (scene, sourceShipPosition, config) => {
    let currentTime;
    let sourceMesh;
    // const rayCaster = new THREE.Raycaster();
    const ballMaterial = new THREE.MeshPhongMaterial( { color: 'green' } );
    const lasers = [];

    function fire(sourceShipMesh, numberOfLasers) {
        // create laser/projectile
        sourceMesh = sourceShipMesh;
        // console.log(`sourceMesh Rotation: ${JSON.stringify(sourceMesh.rotation)}`);
        const angle = sourceMesh.rotation.y * 180/Math.PI;
        // console.log(`rotation angle: ${angle}`);
        const simpleAngle = ((angle * Math.PI/360) % Math.PI)*360/Math.PI;
        // console.log(`simple angle: ${Math.abs(Math.floor(simpleAngle))}`);
        for(let l=0; l<numberOfLasers; l++){
            const laserRadius = 0.2;
            let xPos = sourceShipMesh.position.x;
            let yPos = sourceShipMesh.position.y;
            let zPos = sourceShipMesh.position.z;
            // this is to space out the double lasers for the Tie Fighter when facing different directions
            if((Math.abs(simpleAngle) >= 0 && Math.abs(simpleAngle) <= 1) || (Math.abs(simpleAngle) >= 179 && Math.abs(simpleAngle) <= 180)){
                xPos = l === 0 ? sourceShipMesh.position.x - .5 : sourceShipMesh.position.x + .5;
            }
            // this is to space out the double lasers for the Tie Fighter when facing different directions
            if(Math.abs(simpleAngle) >= 89 && Math.abs(simpleAngle) <= 90 || (Math.abs(simpleAngle) >= 269 && Math.abs(simpleAngle) <= 270)) {
                zPos = l === 0 ? sourceShipMesh.position.z - .5 : sourceShipMesh.position.z + .5;
            }
            const laser = new THREE.Mesh( new THREE.SphereBufferGeometry( laserRadius, 14, 10), ballMaterial );
            console.log('Firing Laser');
            scene.add(laser);

            laser.position.set(xPos, yPos, zPos);

            lasers.push({
                laser,
                sourceMesh: sourceMesh.clone()
            });

            setTimeout(() => {
                    cleanup(laser);
                }
                , 6000);
        }
    }

    function calculateDirectionVector(sourceShipMesh) {
        // console.log(`source ship mesh Vector`);
        const matrix = new THREE.Matrix4();
        matrix.extractRotation(sourceShipMesh.matrix);
        const directionVector = new THREE.Vector3( 0, 0, 1 );
        directionVector.applyMatrix4(matrix);
        return directionVector;
    }

    function moveLaser(time) {
        for(let i=0; i<lasers.length; i++){

            const direction = -1;
            const stepVector = calculateDirectionVector(lasers[i].sourceMesh).multiplyScalar( config.speed * direction );

            lasers[i].laser.position.add(stepVector);
        }
    }

    function cleanup(obj) {
        console.log(`Clean up object laser`);
        const index = lasers.indexOf(obj);
        scene.remove(obj);
        lasers.splice(index,1);
    }

    function checkCollision(pos) {
        if(pos.position){
            const position = pos.position;
            console.log(position.name);
            for(let i=0; i<lasers.length; i++){
                if(position.x >= lasers[i].laser.position.x - .2 && position.x <= lasers[i].laser.position.x + .2 ||
                    position.y >= lasers[i].laser.position.y - .2 && position.y <= lasers[i].laser.position.y + .2 ||
                    position.z >= lasers[i].laser.position.z - .2 && position.z <= lasers[i].laser.position.z + .2){
                    console.log(`position: ${JSON.stringify(position)}`);
                    console.log(`laser position HIT: ${JSON.stringify(lasers[i].laser.position)}`);
                    cleanup(lasers[i]);
                    return { collision: true, name: 'Laser-hit' };
                }
            }
        }
        return { collision: false };

    }

    function update(time) {
        // move laser/ball
        currentTime = time;
        moveLaser(currentTime);
    }

    return {
       fire,
       checkCollision,
       update,
    }
}
