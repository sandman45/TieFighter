import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

function exemptions(type) {
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
        let blastType = "BLAST";
        if(laserType === "REBELLION"){
            blastType = "REBEL_BLAST";
        }
        audio.playSound(blastType, l.laserSet[0]);
        lasers.push(l);
    }

    function update(time) {
        lasers.forEach(laser => {
            laser.update(time);
        });
    }

    // outer checkCollision — loops through all active lasers
    // and delegates to each Laser instance's own checkCollision
    function checkCollision(obj) {
        for(let i=0; i<lasers.length; i++){
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
    const ballMaterial = new THREE.MeshPhongMaterial({ color: LASER_TYPES[laserType] });

    sourceMesh = sourceShipMesh.clone();
    sourceMesh.userId = sourceShipMesh.userId;

    const angle = sourceMesh.rotation.y * 180 / Math.PI;
    const simpleAngle = ((angle * Math.PI / 360) % Math.PI) * 360 / Math.PI;

    for(let l=0; l<numberOfLasers; l++){
        const laserRadius = 0.2;
        let xPos = sourceMesh.position.x;
        let yPos = sourceMesh.position.y;
        let zPos = sourceMesh.position.z;

        if((Math.abs(simpleAngle) >= 0 && Math.abs(simpleAngle) <= 1) ||
            (Math.abs(simpleAngle) >= 179 && Math.abs(simpleAngle) <= 180)){
            xPos = l === 0 ? sourceMesh.position.x - .5 : sourceMesh.position.x + .5;
        }
        if(Math.abs(simpleAngle) >= 89 && Math.abs(simpleAngle) <= 90 ||
            (Math.abs(simpleAngle) >= 269 && Math.abs(simpleAngle) <= 270)){
            zPos = l === 0 ? sourceMesh.position.z - .5 : sourceMesh.position.z + .5;
        }

        const laser = new THREE.Mesh(
            new THREE.SphereBufferGeometry(laserRadius, 14, 10),
            ballMaterial
        );
        scene.add(laser);
        laser.position.set(xPos, yPos, zPos);
        laserSet.push({ laser, sourceMesh });
    }

    function update(time) {
        moveLaser(time);
    }

    // inner checkCollision — uses Box3 against actual mesh geometry
    function checkCollision(pos, name, id) {
        if(!pos || exemptions(sourceMesh.name)) return { collision: false };

        let collisionRes = {};

        laserSet.forEach((laser, i) => {
            // find the actual mesh in the scene by userId
            let targetMesh = null;
            scene.children.forEach(child => {
                if(child.userId === id) targetMesh = child;
            });

            if(!targetMesh) {
                // fallback spread check if mesh not found in scene
                const spread = 2;
                if(
                    (laser.laser.position.x >= (pos.x - spread) && laser.laser.position.x <= (pos.x + spread)) &&
                    (laser.laser.position.y >= (pos.y - spread) && laser.laser.position.y <= (pos.y + spread)) &&
                    (laser.laser.position.z >= (pos.z - spread) && laser.laser.position.z <= (pos.z + spread))
                ) {
                    cleanup(laser.laser, i);
                    collisionRes = { collision: true, name: 'Laser-hit' };
                }
                return;
            }

            // compute world-space bounding box from actual geometry
            const box = new THREE.Box3().setFromObject(targetMesh);

            // expand box slightly per ship type for gameplay feel
            const padding = getPadding(name);
            box.expandByScalar(padding);

            if(box.containsPoint(laser.laser.position)) {
                console.log(`laser HIT ${name}: ${id}`);
                cleanup(laser.laser, i);
                collisionRes = { collision: true, name: 'Laser-hit' };
            }
        });

        return collisionRes.collision ? collisionRes : { collision: false };
    }

    function getPadding(name) {
        const paddings = {
            ISD:             0,
            SHUTTLE:         1,
            Y_WING:          1,
            X_WING:          1,
            A_WING:          1,
            B_WING:          1,
            TIE_FIGHTER:     2,
            TIE_INTERCEPTOR: 2,
            TIE_ADVANCED:    2,
            TIE_DEFENDER:    2,
            TIE_BOMBER:      2,
        };
        return paddings[name] !== undefined ? paddings[name] : 1;
    }

    function calculateDirectionVector(sourceShipMesh) {
        const matrix = new THREE.Matrix4();
        matrix.extractRotation(sourceShipMesh.matrix);
        const directionVector = new THREE.Vector3(0, 0, 1);
        directionVector.applyMatrix4(matrix);
        return directionVector;
    }

    function moveLaser(time) {
        laserSet.forEach((laser, i) => {
            const direction = -1;
            const stepVector = calculateDirectionVector(laser.sourceMesh)
                .multiplyScalar(config.speed * direction);
            const collisions = collisionManager.checkCollision({
                position: laser.laser.position,
                name: 'LASER'
            });

            if(!collisions) {
                laser.laser.position.add(stepVector);
            } else {
                cleanup(laser.laser, i);
            }
        });
    }

    function cleanup(obj, i) {
        scene.remove(obj);
        laserSet.splice(i, 1);
    }

    return {
        laserSet,
        sourceMesh,
        update,
        checkCollision
    }
}