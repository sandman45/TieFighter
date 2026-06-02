import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import {GLTFLoader} from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/loaders/GLTFLoader.js';
import FiniteStateMachine from "./FiniteStateMachine.js";
import NpcControls from "../controls/NpcControls.js";

export const Model = {
    TIE_FIGHTER: "models/tie-fighter/tie.glb",
    TIE_BOMBER: "models/tie-bomber/tie-bomber.glb",
    TIE_INTERCEPTOR: "models/tie-interceptor/tie-interceptor.glb",
    TIE_ADVANCED: "models/tie-advanced/tie-advanced.glb",
    TIE_DEFENDER: "models/tie-defender/tie-defender.glb",
    SHUTTLE: "models/shuttle/shuttle.glb",
    TRANSPORT: "models/transport/star_wars_gr-75_medium_transport.glb",
    ISD: "models/destroyer/isd.glb",
    A_WING: "models/a-wing.glb",
    B_WING: "models/b-wing.glb",
    X_WING: "models/x-wing.glb",
    Y_WING: "models/y-wing.glb"
};

export default (scene, modelConfiguration, model, modelGltf, collisionManager, audio, laser) => {
    let fsm;
    let loader;
    let mixer;
    let clip;
    let action;
    let cm;
    let modelReady = false;
    let lastTime = 0;
    let skyBox = null;
    cm = collisionManager;
    const group = new THREE.Group();
    group.hull = modelConfiguration.hull;
    group.shields = modelConfiguration.shields;
    group.maxHull = modelConfiguration.hull;
    group.maxShields = modelConfiguration.shields;
    group.name = modelConfiguration.name;
    group.userId = modelConfiguration.userId ? modelConfiguration.userId : modelConfiguration.designation;
    group.designation = modelConfiguration.designation;
    group.faction = modelConfiguration.faction;
    group.position.set(modelConfiguration.position.x, modelConfiguration.position.y, modelConfiguration.position.z);

    if(modelGltf) {
        configureGLTFObject(modelGltf);
    } else {
        loadGLTFModel(Model[modelConfiguration.name]);
    }

    if(!modelConfiguration.playerName && collisionManager && audio && laser
        && modelConfiguration.name !== 'ISD' && modelConfiguration.name !== 'TRANSPORT') {
        if(modelConfiguration.name === 'SHUTTLE') {
            initShuttleFSM(group);
        } else {
            initFiniteStateMachine(group);
        }
    }
    scene.add(group);

    function initFiniteStateMachine(modelGroup) {

        function getISD() {
            let isd = null;
            scene.children.forEach(child => {
                if(child.name === 'ISD') isd = child;
            });
            return isd;
        }

        function getPlayer() {
            let player = null;
            scene.children.forEach(child => {
                if(child.faction === 'IMPERIAL' && child.userId) player = child;
            });
            return player;
        }

        function distanceTo(meshA, meshB) {
            if(!meshA || !meshB) return Infinity;
            if(meshB.name === 'ISD') {
                const center = getISDCenter(meshB);
                return meshA.position.distanceTo(center);
            }
            return meshA.position.distanceTo(meshB.position);
        }

        function getISDCenter(isd) {
            const box = new THREE.Box3().setFromObject(isd);
            const center = new THREE.Vector3();
            box.getCenter(center);
            return center;
        }

        function getISDSize(isd) {
            const box = new THREE.Box3().setFromObject(isd);
            const size = new THREE.Vector3();
            box.getSize(size);
            return size;
        }

        function getAttackWaypoint(isd) {
            if(!isd) return null;
            const center = getISDCenter(isd);
            const size   = getISDSize(isd);

            const safeRadiusX = (size.x / 2) + 60;
            const safeRadiusZ = (size.z / 2) + 60;
            const safeRadiusY = (size.y / 2) + 30;

            const angle = Math.random() * Math.PI * 2;

            return new THREE.Vector3(
                center.x + Math.cos(angle) * safeRadiusX * (0.8 + Math.random() * 0.4),
                center.y + (Math.random() - 0.5) * safeRadiusY,
                center.z + Math.sin(angle) * safeRadiusZ * (0.8 + Math.random() * 0.4)
            );
        }

        function getFormWaypoint(isd) {
            if(!isd) return null;
            const center = getISDCenter(isd);
            const size   = getISDSize(isd);

            const angle = Math.random() * Math.PI * 2;
            const radius = (Math.max(size.x, size.z) / 2) + 100;

            return new THREE.Vector3(
                center.x + Math.cos(angle) * radius,
                center.y + (Math.random() - 0.5) * 40,
                center.z + Math.sin(angle) * radius
            );
        }

        // ── ship-to-ship collision ────────────────────────────────
        function checkShipCollision(modelGroup) {
            const myBox = new THREE.Box3().setFromObject(modelGroup);
            myBox.expandByScalar(-2);

            let collision = false;
            let collisionNormal = null;

            scene.children.forEach(child => {
                if(child === modelGroup) return;
                if(!child.userId && !child.designation) return;
                if(child.hull <= 0) return;
                if(child.name === 'EXPLOSION') return;

                const otherBox = new THREE.Box3().setFromObject(child);
                otherBox.expandByScalar(-2);

                if(myBox.intersectsBox(otherBox)) {
                    const myCenter    = new THREE.Vector3();
                    const otherCenter = new THREE.Vector3();
                    myBox.getCenter(myCenter);
                    otherBox.getCenter(otherCenter);

                    collisionNormal = new THREE.Vector3()
                        .subVectors(myCenter, otherCenter)
                        .normalize();

                    collision = true;
                }
            });

            return { collision, collisionNormal };
        }

        function handleShipCollision(newWaypoint) {
            const shipCollision = checkShipCollision(modelGroup);
            if(!shipCollision.collision || !shipCollision.collisionNormal) return false;

            modelGroup.position.addScaledVector(shipCollision.collisionNormal, modelConfiguration.speed * 2);

            if(modelConfiguration.flight && modelConfiguration.flight.velocity) {
                const v = modelConfiguration.flight.velocity;
                const dot = v.dot(shipCollision.collisionNormal);
                v.addScaledVector(shipCollision.collisionNormal, -2 * dot);
                v.x += (Math.random() - 0.5) * 0.1;
                v.z += (Math.random() - 0.5) * 0.1;
                v.setLength(modelConfiguration.speed);
            }

            if(newWaypoint) attackWaypoint = newWaypoint;
            return true;
        }

        const FORM_RANGE     = 250;
        const ATTACK_RANGE   = 180;
        const THREAT_RANGE   = 50;
        const EVADE_DURATION = 10000;
        const EVADE_COOLDOWN = 10000;

        let attackWaypoint = null;
        let evadeTarget = null;
        let evadeTimer = 0;
        let evadeCooldownUntil = 0;

        fsm = new FiniteStateMachine({

            form: {
                enter: () => {
                    console.log(`${modelGroup.designation} entering FORM`);
                    modelConfiguration.flight = null;
                },
                update: () => {
                    const isd = getISD();
                    if(!isd) return;

                    if(handleShipCollision(null)) return;

                    const collision = NpcControls(scene, modelGroup, modelConfiguration, "flightUpdate", -1, cm, audio, laser, isd);

                    if(collision) {
                        modelGroup.position.add(
                            new THREE.Vector3()
                                .subVectors(isd.position, modelGroup.position)
                                .normalize()
                                .multiplyScalar(modelConfiguration.speed * 2)
                        );
                        modelConfiguration.flight = null;
                    }

                    if(distanceTo(modelGroup, isd) < FORM_RANGE) {
                        attackWaypoint = getAttackWaypoint(isd);
                        fsm.transition("attack");
                    }
                }
            },

            attack: {
                enter: () => {
                    console.log(`${modelGroup.designation} entering ATTACK`);
                    const isd = getISD();
                    attackWaypoint = getAttackWaypoint(isd);
                },
                update: () => {
                    const isd = getISD();
                    const player = getPlayer();
                    if(!isd) return;

                    if(handleShipCollision(getAttackWaypoint(isd))) return;

                    if(player && distanceTo(modelGroup, player) < THREAT_RANGE && Date.now() > evadeCooldownUntil) {
                        fsm.transition("evade");
                        return;
                    }

                    const target = attackWaypoint || isd;
                    const collision = NpcControls(scene, modelGroup, modelConfiguration, "flightUpdate", -1, cm, audio, laser, target);

                    if(collision) {
                        attackWaypoint = getAttackWaypoint(isd);
                        modelGroup.position.add(
                            new THREE.Vector3()
                                .subVectors(isd.position, modelGroup.position)
                                .normalize()
                                .multiplyScalar(modelConfiguration.speed * 2)
                        );
                        modelConfiguration.flight = null;
                    }

                    if(distanceTo(modelGroup, isd) < ATTACK_RANGE) {
                        NpcControls(scene, modelGroup, modelConfiguration, "burstFire", -1, cm, audio, laser);
                    }

                    if(attackWaypoint && modelGroup.position.distanceTo(attackWaypoint) < 20) {
                        attackWaypoint = getAttackWaypoint(isd);
                    }
                }
            },

            evade: {
                enter: () => {
                    console.log(`${modelGroup.designation} entering EVADE`);
                    evadeTimer = Date.now() + EVADE_DURATION;
                    const player = getPlayer();
                    if(player) {
                        const away = new THREE.Vector3()
                            .subVectors(modelGroup.position, player.position)
                            .normalize();
                        away.y += (Math.random() - 0.5) * 0.5;
                        away.normalize();
                        evadeTarget = modelGroup.position.clone().add(away.multiplyScalar(100));
                    } else {
                        evadeTarget = modelGroup.position.clone().add(
                            new THREE.Vector3(
                                (Math.random() - 0.5) * 100,
                                (Math.random() - 0.5) * 30,
                                (Math.random() - 0.5) * 100
                            )
                        );
                    }
                    modelConfiguration.flight = null;
                },
                update: () => {
                    if(handleShipCollision(null)) return;

                    const collision = NpcControls(scene, modelGroup, modelConfiguration, "flightUpdate", -1, cm, audio, laser, evadeTarget);

                    if(collision) {
                        fsm.transition("returnToAttack");
                        return;
                    }

                    if(Date.now() > evadeTimer) {
                        fsm.transition("returnToAttack");
                    }
                }
            },

            returnToAttack: {
                enter: () => {
                    console.log(`${modelGroup.designation} entering RETURN_TO_ATTACK`);
                    evadeCooldownUntil = Date.now() + EVADE_COOLDOWN;
                    modelConfiguration.flight = null;
                },
                update: () => {
                    const isd = getISD();
                    if(!isd) return;

                    if(handleShipCollision(null)) return;

                    const collision = NpcControls(scene, modelGroup, modelConfiguration, "flightUpdate", -1, cm, audio, laser, isd);

                    if(collision) {
                        modelGroup.position.add(
                            new THREE.Vector3()
                                .subVectors(isd.position, modelGroup.position)
                                .normalize()
                                .multiplyScalar(modelConfiguration.speed * 2)
                        );
                        modelConfiguration.flight = null;
                    }

                    if(distanceTo(modelGroup, isd) < FORM_RANGE) {
                        fsm.transition("attack");
                    }
                }
            },

            patrol: {
                enter: () => {},
                update: () => {
                    const collision = NpcControls(scene, modelGroup, modelConfiguration, "patrol", -1, cm, audio, laser);
                    if(collision) {
                        NpcControls(scene, modelGroup, modelConfiguration, "turnAround", 1, cm, audio, laser);
                        setTimeout(() => {
                            NpcControls(scene, modelGroup, modelConfiguration, "fire", null, cm, audio, laser);
                        }, 1000);
                    }
                }
            },
            patrol2:       { enter: () => {}, update: () => {} },
            acquireTarget: { enter: () => {}, update: () => {} },
            returnToBase:  {},
            goToLast:      { update: () => {} },
            follow:        { update: () => {} }

        }, "form");
    }

    function initShuttleFSM(modelGroup) {

        function getISD() {
            let isd = null;
            scene.children.forEach(child => {
                if(child.name === 'ISD') isd = child;
            });
            return isd;
        }

        function distanceTo(meshA, target) {
            if(!meshA || !target) return Infinity;
            const targetPos = target.isVector3 ? target : target.position;
            return meshA.position.distanceTo(targetPos);
        }

        const PATROL_DISTANCE  = 1000;
        const ARRIVE_THRESHOLD = 20;
        const DOCK_WAIT        = 20000;

        let waypointA = null;
        let waypointB = null;
        let dockTimer = 0;

        function getPatrolY(isd) { return isd.position.y - 20; }
        function getDockY(isd)   { return isd.position.y + 30; }
        function getPatrolZ(isd) { return isd.position.z - 20; }

        function initWaypoints() {
            const isd = getISD();
            if(!isd || waypointA) return;
            const y = getPatrolY(isd);
            const z = getPatrolZ(isd);
            waypointA = new THREE.Vector3(isd.position.x + PATROL_DISTANCE, y, z);
            waypointB = new THREE.Vector3(isd.position.x - 15, y, z - 80);
        }

        function seedVelocityToward(target) {
            if(!target) { modelConfiguration.flight = null; return; }
            if(!modelConfiguration.flight) {
                const targetPos = target.isVector3 ? target : target.position;
                const toTarget = new THREE.Vector3()
                    .subVectors(targetPos, modelGroup.position)
                    .normalize()
                    .multiplyScalar(modelConfiguration.speed);
                modelConfiguration.flight = { velocity: toTarget, currentBank: 0 };
            }
        }

        fsm = new FiniteStateMachine({

            depart: {
                enter: () => {
                    console.log(`${modelGroup.designation} SHUTTLE entering DEPART`);
                    initWaypoints();
                    if(!modelConfiguration.flight) {
                        seedVelocityToward(waypointA);
                    }
                },
                update: () => {
                    initWaypoints();
                    if(!waypointA) return;

                    const collision = NpcControls(
                        scene, modelGroup, modelConfiguration,
                        "flightUpdate", -1, cm, audio, laser, waypointA
                    );

                    if(collision) {
                        modelConfiguration.flight = null;
                        seedVelocityToward(waypointA);
                    }

                    if(distanceTo(modelGroup, waypointA) < ARRIVE_THRESHOLD) {
                        fsm.transition("return");
                    }
                }
            },

            return: {
                enter: () => {
                    console.log(`${modelGroup.designation} SHUTTLE entering RETURN`);
                    initWaypoints();
                    seedVelocityToward(waypointB);
                },
                update: () => {
                    if(!waypointB) return;

                    const collision = NpcControls(
                        scene, modelGroup, modelConfiguration,
                        "flightUpdate", -1, cm, audio, laser, waypointB
                    );

                    if(collision) {
                        modelConfiguration.flight = null;
                        seedVelocityToward(waypointB);
                    }

                    if(distanceTo(modelGroup, waypointB) < ARRIVE_THRESHOLD) {
                        fsm.transition("slowDown");
                    }
                }
            },

            slowDown: {
                enter: () => {
                    console.log(`${modelGroup.designation} SHUTTLE entering SLOW_DOWN`);
                },
                update: () => {
                    if(!modelConfiguration.flight) {
                        fsm.transition("rise");
                        return;
                    }

                    const f = modelConfiguration.flight;
                    const currentSpeed = f.velocity.length();
                    const newSpeed = THREE.MathUtils.lerp(currentSpeed, 0, 0.03);

                    if(newSpeed > 0.01) {
                        f.velocity.setLength(newSpeed);

                        const targetYaw = Math.atan2(f.velocity.x, f.velocity.z) + Math.PI;
                        let yawDiff = targetYaw - modelGroup.rotation.y;
                        while(yawDiff >  Math.PI) yawDiff -= Math.PI * 2;
                        while(yawDiff < -Math.PI) yawDiff += Math.PI * 2;
                        modelGroup.rotation.y += yawDiff * 0.04;

                        modelGroup.position.add(f.velocity);
                    } else {
                        f.velocity.set(0, 0, 0);
                        fsm.transition("rise");
                    }
                }
            },

            rise: {
                enter: () => {
                    console.log(`${modelGroup.designation} SHUTTLE entering RISE`);
                    wingsUp();
                    if(!modelConfiguration.flight) {
                        modelConfiguration.flight = { velocity: new THREE.Vector3(0,0,0), currentBank: 0 };
                    }
                    modelConfiguration.flight.velocity.set(0, 0, 0);
                },
                update: () => {
                    const isd = getISD();
                    if(!isd) return;

                    const riseTarget = new THREE.Vector3(
                        isd.position.x,
                        getDockY(isd),
                        getPatrolZ(isd) - 80
                    );

                    const dist = modelGroup.position.distanceTo(riseTarget);

                    if(dist > 1) {
                        const step = new THREE.Vector3()
                            .subVectors(riseTarget, modelGroup.position)
                            .normalize()
                            .multiplyScalar(modelConfiguration.speed * 0.25);
                        modelGroup.position.add(step);
                    }

                    let yawDiff = 0 - modelGroup.rotation.y;
                    while(yawDiff >  Math.PI) yawDiff -= Math.PI * 2;
                    while(yawDiff < -Math.PI) yawDiff += Math.PI * 2;
                    modelGroup.rotation.y += yawDiff * 0.015;
                    modelGroup.rotation.z  = THREE.MathUtils.lerp(modelGroup.rotation.z, 0, 0.03);
                    modelGroup.rotation.x  = THREE.MathUtils.lerp(modelGroup.rotation.x, 0, 0.03);

                    if(dist < 2) {
                        fsm.transition("docked");
                    }
                }
            },

            docked: {
                enter: () => {
                    console.log(`${modelGroup.designation} SHUTTLE entering DOCKED`);
                    dockTimer = Date.now() + DOCK_WAIT;
                    if(modelConfiguration.flight) {
                        modelConfiguration.flight.velocity.set(0, 0, 0);
                    }
                },
                update: () => {
                    if(Date.now() > dockTimer) {
                        fsm.transition("lower");
                    }
                }
            },

            lower: {
                enter: () => {
                    console.log(`${modelGroup.designation} SHUTTLE entering LOWER`);
                    if(!modelConfiguration.flight) {
                        modelConfiguration.flight = { velocity: new THREE.Vector3(0,0,0), currentBank: 0 };
                    }
                    modelConfiguration.flight.velocity.set(0, 0, 0);
                    wingsDown();
                },
                update: () => {
                    const isd = getISD();
                    if(!isd) return;

                    const lowerTarget = new THREE.Vector3(
                        isd.position.x,
                        getPatrolY(isd),
                        getPatrolZ(isd) - 80
                    );

                    const dist = modelGroup.position.distanceTo(lowerTarget);

                    if(dist > 1) {
                        const step = new THREE.Vector3()
                            .subVectors(lowerTarget, modelGroup.position)
                            .normalize()
                            .multiplyScalar(modelConfiguration.speed * 0.25);
                        modelGroup.position.add(step);
                    }

                    // rotate toward waypointA while lowering
                    if(waypointA) {
                        const toWaypoint = new THREE.Vector3()
                            .subVectors(waypointA, modelGroup.position)
                            .normalize();
                        const targetYaw = Math.atan2(toWaypoint.x, toWaypoint.z);
                        let yawDiff = targetYaw - modelGroup.rotation.y;
                        while(yawDiff >  Math.PI) yawDiff -= Math.PI * 2;
                        while(yawDiff < -Math.PI) yawDiff += Math.PI * 2;
                        modelGroup.rotation.y += yawDiff * 0.012;
                    }

                    if(dist < 2) {
                        const facingMatrix = new THREE.Matrix4().extractRotation(modelGroup.matrix);
                        const facingDir = new THREE.Vector3(0, 0, -1).applyMatrix4(facingMatrix);
                        modelConfiguration.flight = {
                            velocity: facingDir.multiplyScalar(modelConfiguration.speed * 0.3),
                            currentBank: 0
                        };
                        fsm.transition("turnToDepart");
                    }
                }
            },

            turnToDepart: {
                enter: () => {
                    console.log(`${modelGroup.designation} SHUTTLE entering TURN_TO_DEPART`);
                },
                update: () => {
                    if(!waypointA) return;

                    const toWaypoint = new THREE.Vector3()
                        .subVectors(waypointA, modelGroup.position)
                        .normalize();
                    const targetYaw = Math.atan2(toWaypoint.x, toWaypoint.z);

                    let yawDiff = targetYaw - modelGroup.rotation.y;
                    while(yawDiff >  Math.PI) yawDiff -= Math.PI * 2;
                    while(yawDiff < -Math.PI) yawDiff += Math.PI * 2;

                    modelGroup.rotation.y += yawDiff * 0.02;

                    if(Math.abs(yawDiff) < 0.05) {
                        const facingMatrix = new THREE.Matrix4().extractRotation(modelGroup.matrix);
                        const facingDir = new THREE.Vector3(0, 0, -1).applyMatrix4(facingMatrix);
                        modelConfiguration.flight = {
                            velocity: facingDir.multiplyScalar(modelConfiguration.speed * 0.3),
                            currentBank: 0
                        };
                        fsm.transition("depart");
                    }
                }
            },

        }, "depart");
    }

    function loadGLTFModel(modelGltf) {
        loader = new GLTFLoader();
        loader.load(modelGltf, function(gltf, err) {
            if(err){
                console.log(`${JSON.stringify(err)}`);
            }
            const root = gltf.scene;
            root.rotation.y = modelConfiguration.rotation.y;
            root.scale.x = modelConfiguration.scale;
            root.scale.y = modelConfiguration.scale;
            root.scale.z = modelConfiguration.scale;
            root.name = modelConfiguration.name;
            if(gltf.animations.length > 0){
                animations(gltf);
            }
            modelReady = true;
            group.add(root);
        });
    }

    function configureGLTFObject(modelGltf) {
        const root = modelGltf.scene;
        root.rotation.y = modelConfiguration.rotation.y;
        root.scale.x = modelConfiguration.scale;
        root.scale.y = modelConfiguration.scale;
        root.scale.z = modelConfiguration.scale;
        root.name = modelConfiguration.name;

        if (modelGltf.animations.length > 0) {
            animations(modelGltf);
        }
        modelReady = true;
        group.add(root);
    }

    function animations(gltf) {
        mixer = new THREE.AnimationMixer(gltf.scene);
        clip = THREE.AnimationClip.findByName(gltf.animations, 'Take 01');
        action = mixer.clipAction(clip);
        action.clampWhenFinished = true;
        action.timeScale = 1/15;
    }

    function wingsDown() {
        console.log(`wingsDown called`);
        if(!mixer || !action || !clip) return;
        action.stop();
        action.reset();
        action.timeScale = 1;
        action.loop = THREE.LoopOnce;
        action.clampWhenFinished = true;
        action.play();

        const halfTime = (clip.duration / 2) * 1000;
        setTimeout(() => {
            if(action) {
                action.paused = true;
                console.log(`wingsDown paused at halfway: ${action.time}`);
            }
        }, halfTime);
    }

    function wingsUp() {
        console.log(`wingsUp called`);
        if(!mixer || !action || !clip) return;
        action.stop();
        action.reset();
        action.timeScale = 1;
        action.loop = THREE.LoopOnce;
        action.clampWhenFinished = true;
        action.time = clip.duration / 2;
        action.play();

        const halfTime = (clip.duration / 2) * 1000;
        setTimeout(() => {
            if(action) {
                action.paused = true;
                console.log(`wingsUp paused at: ${action.time}`);
            }
        }, halfTime);
    }

    function update(time) {
        if(mixer && time && modelReady){
            const delta = time - lastTime;
            mixer.update(delta);
        }
        lastTime = time;
        if(fsm) {
            fsm.update();
        }
    }

    function playAnimations() {
        if(mixer){
            modelReady = !modelReady;
            if(modelReady){
                action.play();
                action.paused = false;
            } else {
                action.paused = true;
            }
        }
    }

    return {
        mesh: group,
        update,
        playAnimations,
        wingsDown,
        wingsUp
    }
}