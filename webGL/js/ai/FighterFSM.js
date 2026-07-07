import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import FiniteStateMachine from "../utils/FiniteStateMachine.js";
import NpcControls from "../controls/NpcControls.js";

export default ({ scene, modelGroup, modelConfiguration, collisionManager, audio, laser }) => {
    const cm = collisionManager;
    let fsm;

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

    return fsm;
};
