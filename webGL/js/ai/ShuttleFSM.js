import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import FiniteStateMachine from "../utils/FiniteStateMachine.js";
import NpcControls from "../controls/NpcControls.js";

export default ({ scene, modelGroup, modelConfiguration, collisionManager, audio, laser, wingsUp, wingsDown }) => {
    const cm = collisionManager;
    let fsm;

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

    return fsm;
};
