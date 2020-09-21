import * as THREE from '../../../node_modules/three/build/three.module.js'

export default (scene, sourceShipPosition, config, collisionManager) => {

    const lasers = [];

    function fire(sourceShipMesh, numberOfLasers) {
        lasers.push(new Laser(scene, sourceShipMesh, numberOfLasers, config, collisionManager));
    }

    function update(time) {
        lasers.forEach( laser => {
            laser.update(time);
        } );
    }

    function checkCollision(obj) {
       for(let i=0; i<lasers.length; i++){
           const collisionCheck = lasers[i].checkCollision(obj.position);
           if(collisionCheck.collision){
               return collisionCheck;
           }
       }
       return { collision: false };
    }

    return {
       fire,
       checkCollision,
       update,
    }
}

function Laser(scene, sourceShipMesh, numberOfLasers, config, collisionManager) {
    let sourceMesh;
    let laserSet = [];
    const ballMaterial = new THREE.MeshPhongMaterial( { color: 'green' } );
    // create laser/projectile
    sourceMesh = sourceShipMesh.clone();
    // console.log(`sourceMesh Rotation: ${JSON.stringify(sourceMesh.rotation)}`);
    const angle = sourceMesh.rotation.y * 180/Math.PI;
    // console.log(`rotation angle: ${angle}`);
    const simpleAngle = ((angle * Math.PI/360) % Math.PI)*360/Math.PI;
    // console.log(`simple angle: ${Math.abs(Math.floor(simpleAngle))}`);
    for(let l=0; l<numberOfLasers; l++){
        const laserRadius = 0.2;
        let xPos = sourceMesh.position.x;
        let yPos = sourceMesh.position.y;
        let zPos = sourceMesh.position.z;
        // this is to space out the double lasers for the Tie Fighter when facing different directions
        if((Math.abs(simpleAngle) >= 0 && Math.abs(simpleAngle) <= 1) || (Math.abs(simpleAngle) >= 179 && Math.abs(simpleAngle) <= 180)){
            xPos = l === 0 ? sourceMesh.position.x - .5 : sourceMesh.position.x + .5;
        }
        // this is to space out the double lasers for the Tie Fighter when facing different directions
        if(Math.abs(simpleAngle) >= 89 && Math.abs(simpleAngle) <= 90 || (Math.abs(simpleAngle) >= 269 && Math.abs(simpleAngle) <= 270)) {
            zPos = l === 0 ? sourceMesh.position.z - .5 : sourceMesh.position.z + .5;
        }
        const laser = new THREE.Mesh( new THREE.SphereBufferGeometry( laserRadius, 14, 10), ballMaterial );
        console.log('Firing Laser');
        scene.add(laser);

        laser.position.set(xPos, yPos, zPos);

        laserSet.push({
            laser,
            sourceMesh
        });
    }

    function update(time) {
        // move laser
        moveLaser(time);
    }

    function checkCollision(pos) {
        if(pos.position){
            const position = pos.position;
            console.log(position.name);
           laserSet.forEach((laser, i) => {
               if(position.x >= laser.laser.position.x - .2 && position.x <= laser.laser.position.x + .2 ||
                   position.y >= laser.laser.position.y - .2 && position.y <= laser.laser.position.y + .2 ||
                   position.z >= laser.laser.position.z - .2 && position.z <= laser.laser.position.z + .2){
                   console.log(`position: ${JSON.stringify(position)}`);
                   console.log(`laser position HIT: ${JSON.stringify(laser.laser.position)}`);
                   cleanup(laser.laser, i);
                   return { collision: true, name: 'Laser-hit' };
               }
           });
        }

        return { collision: false };
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
        laserSet.forEach((laser, i) => {
            const direction = -1;
            const stepVector = calculateDirectionVector(laser.sourceMesh).multiplyScalar( config.speed * direction );
            const collisions = collisionManager.checkCollision({ position: laser.laser.position, name: 'LASER'});

            if(!collisions) {
                laser.laser.position.add(stepVector);
            } else {
                cleanup(laser.laser, i);
            }
        });
    }

    function cleanup(obj, i) {
        console.log(`Clean up object laser`);
        // const index = lasers.indexOf(obj);
        scene.remove(obj);
        // remove from array?
        laserSet.splice(i, 1);
        // lasers.splice(index,1);
    }

    return {
        laserSet,
        sourceMesh,
        update,
        checkCollision
    }
}
