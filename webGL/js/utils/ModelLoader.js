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
    // change the guard to only exclude ISD
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
            // for the ISD use its visual center not group origin
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

            // orbit radius based on actual ship size — stay outside the hull
            const safeRadiusX = (size.x / 2) + 60;
            const safeRadiusZ = (size.z / 2) + 60;
            const safeRadiusY = (size.y / 2) + 30;

            // pick a random angle around the ship
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

            // form up at a safe distance from the ship
            const angle = Math.random() * Math.PI * 2;
            const radius = (Math.max(size.x, size.z) / 2) + 100;

            return new THREE.Vector3(
                center.x + Math.cos(angle) * radius,
                center.y + (Math.random() - 0.5) * 40,
                center.z + Math.sin(angle) * radius
            );
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

            // fly toward ISD in formation
            form: {
                enter: () => {
                    console.log(`${modelGroup.designation} entering FORM`);
                    // reset flight state so momentum starts fresh
                    modelConfiguration.flight = null;
                },
                update: () => {
                    const isd = getISD();
                    if(!isd) return;

                    const formTarget = getFormWaypoint(isd);
                    const collision = NpcControls(scene, modelGroup, modelConfiguration, "flightUpdate", -1, cm, audio, laser, isd);

                    if(collision) {
                        // nudge back toward ISD on boundary hit
                        modelGroup.position.add(
                            new THREE.Vector3()
                                .subVectors(isd.position, modelGroup.position)
                                .normalize()
                                .multiplyScalar(modelConfiguration.speed * 2)
                        );
                        modelConfiguration.flight = null; // reset momentum
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
                        modelConfiguration.flight = null; // reset momentum on wall hit
                    }

                    // fire when close to ISD
                    if(distanceTo(modelGroup, isd) < ATTACK_RANGE) {
                        NpcControls(scene, modelGroup, modelConfiguration, "burstFire", -1, cm, audio, laser);
                    }

                    // pick new overshoot waypoint when close to current one
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
                    // fly directly away from player with some vertical variation
                    if(player) {
                        const away = new THREE.Vector3()
                            .subVectors(modelGroup.position, player.position)
                            .normalize();
                        away.y += (Math.random() - 0.5) * 0.5; // add vertical variation
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
                    modelConfiguration.flight = null; // reset momentum for sharp evasion
                },
                update: () => {
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
                    modelConfiguration.flight = null; // reset momentum
                },
                update: () => {
                    const isd = getISD();
                    if(!isd) return;

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

            // keep old states so nothing breaks
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
        const DOCK_WAIT        = 20000; // 20 seconds

        let waypointA       = null;
        let waypointB       = null;
        let dockTimer       = 0;

        // positions relative to ISD
        function getPatrolY(isd) { return isd.position.y - 20; }  // patrol height
        function getDockY(isd)   { return isd.position.y + 30;  }  // risen Y toward ISD underside
        function getPatrolZ(isd) { return isd.position.z - 20; }  // patrol Z — unchanged

        function initWaypoints() {
            const isd = getISD();
            if(!isd || waypointA) return;
            const y = getPatrolY(isd);
            const z = getPatrolZ(isd);
            // waypointA — far out on positive X
            waypointA = new THREE.Vector3(isd.position.x + PATROL_DISTANCE, y, z);
            // waypointB — directly under ISD at patrol Z
            waypointB = new THREE.Vector3(isd.position.x - 15, y, z-80);
        }

        function seedVelocityToward(target) {
            if(!target) { modelConfiguration.flight = null; return; }
            // only seed if no flight state exists yet — otherwise let momentum carry
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

            // ── DEPART ───────────────────────────────────────────────
            // fly out to waypointA
            depart: {
                enter: () => {
                    console.log(`${modelGroup.designation} SHUTTLE entering DEPART`);
                    console.log(`${modelGroup.designation} x: ${modelGroup.position.x}, y:${modelGroup.position.y}, z: ${modelGroup.position.z}`);
                    initWaypoints();
                    // only seed on very first load when there is no flight state at all
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
                    // only seed if no flight state — let momentum carry into the turn
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

            // ── SLOW DOWN ────────────────────────────────────────────
            // bleed off speed to a stop under the ISD
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

                        // smooth yaw while slowing
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

            // ── RISE ─────────────────────────────────────────────────
            // rise on Z axis toward ISD underside and slowly rotate
            rise: {
                enter: () => {
                    console.log(`${modelGroup.designation} SHUTTLE entering RISE`);
                    wingsUp(); // raise wings as shuttle rises to dock
                    if(!modelConfiguration.flight) {
                        modelConfiguration.flight = { velocity: new THREE.Vector3(0,0,0), currentBank: 0 };
                    }
                    modelConfiguration.flight.velocity.set(0, 0, 0);
                },
                update: () => {
                    const isd = getISD();
                    if(!isd) return;

                    // rise target — same X and Y, Z moves toward ISD
                    const riseTarget = new THREE.Vector3(
                        isd.position.x,
                        getDockY(isd),   // rise on Y toward ISD underside
                        (getPatrolZ(isd) - 80)  // Z stays at patrol level
                    );

                    const dist = modelGroup.position.distanceTo(riseTarget);

                    if(dist > 1) {
                        const step = new THREE.Vector3()
                            .subVectors(riseTarget, modelGroup.position)
                            .normalize()
                            .multiplyScalar(modelConfiguration.speed * 0.25);
                        modelGroup.position.add(step);
                    }

                    // slowly rotate to docking orientation
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

            // ── DOCKED ───────────────────────────────────────────────
            // sit still for 20 seconds
            docked: {
                enter: () => {
                    console.log(`${modelGroup.designation} SHUTTLE entering DOCKED`);
                    dockTimer = Date.now() + DOCK_WAIT;
                    if(modelConfiguration.flight) {
                        modelConfiguration.flight.velocity.set(0, 0, 0);
                    }
                },
                update: () => {
                    // hold position — no movement
                    if(Date.now() > dockTimer) {
                        fsm.transition("lower");
                    }
                }
            },

            // ── LOWER ────────────────────────────────────────────────
            // descend back on Z axis to patrol Z before departing
            // ── LOWER ────────────────────────────────────────────────
            lower: {
                enter: () => {
                    console.log(`${modelGroup.designation} SHUTTLE entering LOWER`);
                    if(!modelConfiguration.flight) {
                        modelConfiguration.flight = { velocity: new THREE.Vector3(0,0,0), currentBank: 0 };
                    }
                    modelConfiguration.flight.velocity.set(0, 0, 0);
                    wingsDown(); // lower wings before departing
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

                    if(dist < 2) {
                        modelConfiguration.flight = { velocity: new THREE.Vector3(0,0,0), currentBank: 0 };
                        fsm.transition("turnToDepart");
                    }
                }
            },

            // ── TURN TO DEPART ───────────────────────────────────────
            // rotate in place to face waypointA before departing
            turnToDepart: {
                enter: () => {
                    console.log(`${modelGroup.designation} SHUTTLE entering TURN_TO_DEPART`);
                },
                update: () => {
                    if(!waypointA) return;

                    // calculate angle to waypointA
                    const toWaypoint = new THREE.Vector3()
                        .subVectors(waypointA, modelGroup.position)
                        .normalize();
                    const targetYaw = Math.atan2(toWaypoint.x, toWaypoint.z);

                    // find shortest angle difference
                    let yawDiff = targetYaw - modelGroup.rotation.y;
                    while(yawDiff >  Math.PI) yawDiff -= Math.PI * 2;
                    while(yawDiff < -Math.PI) yawDiff += Math.PI * 2;

                    // rotate slowly in place
                    modelGroup.rotation.y += yawDiff * 0.02;

                    // once close enough to facing waypointA — start flying
                    if(Math.abs(yawDiff) < 0.05) {
                        // seed velocity in exact direction we are now facing
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
    /**
     * loadGLTFModel
     * @description this will load the GLTF model
     * from file and sets it up
     * @param modelGltf
     */
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

    /**
     * configureGLTFObject
     * @description this takes a gltf model already loaded
     * by the manager and configures it before adding it to the group which
     * has already been added to the scene
     * @param modelGltf
     */
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
        // clips = modelGltf.animations;
        clip = THREE.AnimationClip.findByName(gltf.animations, 'Take 01');
        action = mixer.clipAction(clip);
        // action.loop = THREE.LoopRepeat;
        action.clampWhenFinished = true;
        action.timeScale = 1/15;
        // action.play();
    }

    function wingsDown() {
        console.log(`wingsDown called`);
        if(!mixer || !action || !clip) return;
        action.stop();
        action.reset();
        action.timeScale = 1;      // play at normal speed
        action.loop = THREE.LoopOnce;
        action.clampWhenFinished = true;
        action.play();

        // pause at halfway through the clip
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
        action.timeScale = 1;              // play forward
        action.loop = THREE.LoopOnce;
        action.clampWhenFinished = true;
        action.time = clip.duration / 2;  // start from halfway — wings down position
        action.play();

        // pause at end of clip — wings fully up
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
