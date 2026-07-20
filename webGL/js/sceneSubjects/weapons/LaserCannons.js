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
        console.log(`${sourceShipMesh.designation || sourceShipMesh.userId} (${sourceShipMesh.name}) fired`);
        const l = new Laser(scene, sourceShipMesh, numberOfLasers, config, collisionManager, laserType);
        let blastType = "BLAST";
        if(laserType === "REBELLION"){
            blastType = "REBEL_BLAST";
        }
        audio.playSound(blastType, l.laserSet[0].laser);
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
    sourceMesh.designation = sourceShipMesh.designation;

    // wing-mounted cannon offset, perpendicular to the ship's actual current
    // facing — works at any heading, unlike a cardinal-angle special case which
    // left both balls stacked at the same spot the rest of the time
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(sourceMesh.rotation);
    const right = new THREE.Vector3(1, 0, 0).applyMatrix4(rotationMatrix).normalize();

    for(let l=0; l<numberOfLasers; l++){
        const laserRadius = 0.2;
        const side = l === 0 ? -0.5 : 0.5;
        const spawnPos = sourceMesh.position.clone().addScaledVector(right, side);

        const laser = new THREE.Mesh(
            new THREE.SphereBufferGeometry(laserRadius, 14, 10),
            ballMaterial
        );
        scene.add(laser);
        laser.position.copy(spawnPos);
        laserSet.push({ laser, sourceMesh });
    }

    function update(time) {
        moveLaser(time);
    }

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
                // fallback spread check
                const spread = 2;
                if(
                    (laser.laser.position.x >= (pos.x - spread) && laser.laser.position.x <= (pos.x + spread)) &&
                    (laser.laser.position.y >= (pos.y - spread) && laser.laser.position.y <= (pos.y + spread)) &&
                    (laser.laser.position.z >= (pos.z - spread) && laser.laser.position.z <= (pos.z + spread))
                ) {
                    cleanup(laser.laser, i);
                    collisionRes = {
                        collision: true,
                        name: 'Laser-hit',
                        hitPoint: laser.laser.position.clone() // laser position as fallback
                    };
                }
            }

            // first do a fast Box3 pre-check to avoid expensive raycasting
            // when laser is nowhere near the target
            const box = new THREE.Box3().setFromObject(targetMesh);
            const preCheckPadding = getPadding(name);
            box.expandByScalar(preCheckPadding);

            if(!box.containsPoint(laser.laser.position)) {
                // laser not even close — skip raycasting entirely
                return;
            }

            // laser is inside the bounding box — do precise raycast check
            // cast a ray from slightly behind the laser toward its travel direction.
            // build the matrix from .rotation, NOT .matrix — .matrix on the cloned
            // sourceMesh was only as fresh as the shooter's matrix at fire time, which
            // is refreshed by the render pass and so lags one tick behind .rotation
            const matrix = new THREE.Matrix4().makeRotationFromEuler(sourceMesh.rotation);
            const laserDir = new THREE.Vector3(0, 0, 1).applyMatrix4(matrix).normalize();

            // cast from a small distance behind the laser position
            const rayOrigin = laser.laser.position.clone().addScaledVector(laserDir, 2);
            const rayDir    = laserDir.clone().negate();

            const raycaster = new THREE.Raycaster(rayOrigin, rayDir, 0, 4);

            // collect all meshes in the target group for raycasting
            const meshesToCheck = [];
            targetMesh.traverse(child => {
                if(child.isMesh) meshesToCheck.push(child);
            });

            const intersects = raycaster.intersectObjects(meshesToCheck, false);

            if(intersects.length > 0) {
                console.log(`precise laser HIT ${name}: ${id} at distance ${intersects[0].distance} — fired by ${sourceMesh.designation || sourceMesh.userId} (${sourceMesh.name})`);
                cleanup(laser.laser, i);
                // return the actual world-space hit point
                collisionRes = {
                    collision: true,
                    name: 'Laser-hit',
                    hitPoint: intersects[0].point.clone()
                };
            }
        });

        return collisionRes.collision ? collisionRes : { collision: false };
    }

    function getPadding(name) {
        // pre-check box padding — just needs to be big enough
        // to not miss fast-moving lasers, raycast handles precision
        const paddings = {
            ISD:             15,  // large ship — wider pre-check zone
            SHUTTLE:         5,
            Y_WING:          5,
            X_WING:          5,
            A_WING:          4,
            B_WING:          5,
            TIE_FIGHTER:     3,
            TIE_INTERCEPTOR: 3,
            TIE_ADVANCED:    3,
            TIE_DEFENDER:    3,
            TIE_BOMBER:      3,
        };
        return paddings[name] !== undefined ? paddings[name] : 4;
    }

    function calculateDirectionVector(sourceShipMesh) {
        // .rotation, not .matrix — see note above on stale-matrix lag
        const matrix = new THREE.Matrix4();
        matrix.makeRotationFromEuler(sourceShipMesh.rotation);
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