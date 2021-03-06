// import * as THREE from '../../../node_modules/three/build/three.module.js'
import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

function exemptions(type) {
    // need to update this so if its your own
    // lasers then ignore the collision if there is one
    const types = {
        EXPLOSION: "EXPLOSION",
    };

    return types[type];
}
const LASER_TYPES = {
    IMPERIAL: "green",
    REBELLION: "red"
};
export default (scene, config, collisionManager, audio) => {

    const lasers = [];
    function fire(sourceShipMesh, numberOfLasers, laserType) {

        const l = new Laser(scene, sourceShipMesh, numberOfLasers, config, collisionManager, laserType);
        // trigger sound
        let blastType = "BLAST";
        if(laserType === "REBELLION"){
            blastType = "REBEL_BLAST"
        }
        audio.playSound(blastType, l.laserSet[0]);
        lasers.push(l);
    }

    function update(time) {
        lasers.forEach( laser => {
            laser.update(time);
        } );
    }

    function checkCollision(obj) {
       for(let i=0; i<lasers.length; i++){
           // was i the source of the laser?
           if(obj.userId !== lasers[i].sourceMesh.userId){
               if(!exemptions(obj.name)){
                   const collisionCheck = lasers[i].checkCollision(obj.position, obj.name, obj.userId);
                   if(collisionCheck.collision){
                       return collisionCheck;
                   }
               }
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

function Laser(scene, sourceShipMesh, numberOfLasers, config, collisionManager, laserType) {
    let sourceMesh;
    let laserSet = [];
    const ballMaterial = new THREE.MeshPhongMaterial( { color: LASER_TYPES[laserType] } );
    // create laser/projectile
    sourceMesh = sourceShipMesh.clone();
    sourceMesh.userId = sourceShipMesh.userId;
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
        // console.log('Firing Laser');
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

    function checkCollision(pos, name, id) {
        if(pos && !exemptions(sourceMesh.name)){
            const position = pos;
            const spread = 2;
            let collisionRes = {};
            laserSet.forEach((laser, i) => {
               if((laser.laser.position.x >= (position.x - spread) && laser.laser.position.x <= (position.x + spread)) &&
                   (laser.laser.position.y >= (position.y - spread) && laser.laser.position.y <= (position.y + spread)) &&
                   (laser.laser.position.z >= (position.z - spread) && laser.laser.position.z <= (position.z + spread))
               ){
                   console.log(`laser HIT ${name}: ${id} at position: ${JSON.stringify(laser.laser.position)}`);
                   if(laser.sourceMesh.userId === id){
                       console.log(`we should skip this and not return true`);
                   }
                   cleanup(laser.laser, i);
                   collisionRes = { collision: true, name: 'Laser-hit' };
               }
           });
           return collisionRes;
        }
        return { collision: false };
    }

    function calculateDirectionVector(sourceShipMesh) {
        let directionVector;
        const matrix = new THREE.Matrix4();
        matrix.extractRotation(sourceShipMesh.matrix);
        directionVector = new THREE.Vector3( 0, 0, 1 );
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
        // console.log(`Clean up object laser`);
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
