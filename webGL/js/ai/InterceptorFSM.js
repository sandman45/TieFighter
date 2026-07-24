import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import FiniteStateMachine from "./FiniteStateMachine.js";
import NpcControls from "../controls/NpcControls.js";
import EventBus from "../eventBus/EventBus.js";
import events from "../eventBus/events.js";
import { showToast } from "../HUD/hud.js";

// EventBus has no unsubscribe, and this factory re-subscribes on every mission
// (re)play — without a run guard, replaying the mission would stack duplicate
// closures, each capable of firing an old scene's fsm.transition (see the
// identical guard in ShuttleFSM.js/MissionObjectives.js). Unlike those two
// singletons, several interceptors exist at once in the same mission run, so
// the guard is keyed per-designation rather than a single shared counter —
// otherwise creating the 2nd/3rd X-wing would bump a shared counter and
// immediately invalidate the 1st/2nd ones' own subscriptions.
const latestRunIdByDesignation = new Map();

// An attack-run interceptor: sits hidden and off the targeting scope at the
// edge of the system (see ModelLoader's arrived flag) until
// modelConfiguration.spawnTrigger is identified by the player (the same
// moment that clears the escorted shuttle to launch — see ShuttleFSM's
// TARGET_IDENTIFIED subscription). It then "hyperspaces in" — becomes visible
// and targetable — and flies toward the live position of
// modelConfiguration.spawnTrigger's ship (TRANSPORT_A), NOT straight at the
// escorted shuttle: at the instant this triggers, the shuttle is still
// parked right at the ISD, so aiming at its live position immediately would
// send the interceptor straight into the ISD's hull before the shuttle has
// had any time to move clear of it. Heading for the transport instead — off
// on its own, away from the ISD — sidesteps that collision without needing
// a fixed waypoint. Only once it arrives in that vicinity does it turn to
// actually engage: repeatedly making a strafing pass at the escortTarget's
// live position (falling back to the player once it's destroyed): fly a
// fixed point past the target, firing along the way, then peel off to a
// nearby egress point before turning back in for another pass. This is the
// same attack/egress shape as FighterFSM's ISD attack runs, just without any
// of FighterFSM's ISD-hull-shaped avoidance/waypoint machinery, since neither
// the shuttle nor the player have anything like the ISD's hull to route around.
export default ({ scene, modelGroup, modelConfiguration, collisionManager, audio, laser, wingsUp, wingsDown }) => {
    const runId = (latestRunIdByDesignation.get(modelGroup.designation) || 0) + 1;
    latestRunIdByDesignation.set(modelGroup.designation, runId);
    const cm = collisionManager;
    let fsm;

    function getShipByDesignation(designation) {
        if(!designation) return null;
        let found = null;
        scene.children.forEach(child => {
            if(child.designation === designation) found = child;
        });
        return found;
    }

    // faction alone isn't enough to single out the player — every ship gets a
    // truthy userId (falling back to its designation), so only playerName
    // (set solely on the player's own mesh) reliably identifies it
    function getPlayer() {
        let player = null;
        scene.children.forEach(child => {
            if(child.playerName) player = child;
        });
        return player;
    }

    function isAlive(mesh) {
        return !!mesh && mesh.hull > 0;
    }

    function distanceTo(meshA, meshB) {
        if(!meshA || !meshB) return Infinity;
        return meshA.position.distanceTo(meshB.position);
    }

    // generic ship-to-ship collision avoidance (the ISD included) — same
    // approach as FighterFSM's checkShipCollision/handleShipCollision
    function checkShipCollision() {
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
                const myCenter = new THREE.Vector3();
                const otherCenter = new THREE.Vector3();
                myBox.getCenter(myCenter);
                otherBox.getCenter(otherCenter);
                collisionNormal = new THREE.Vector3().subVectors(myCenter, otherCenter).normalize();
                collision = true;
            }
        });

        return { collision, collisionNormal };
    }

    function handleShipCollision() {
        const { collision, collisionNormal } = checkShipCollision();
        if(!collision || !collisionNormal) return false;

        modelGroup.position.addScaledVector(collisionNormal, modelConfiguration.speed * 2);

        if(modelConfiguration.flight && modelConfiguration.flight.velocity) {
            const v = modelConfiguration.flight.velocity;
            const dot = v.dot(collisionNormal);
            v.addScaledVector(collisionNormal, -2 * dot);
            v.x += (Math.random() - 0.5) * 0.1;
            v.z += (Math.random() - 0.5) * 0.1;
            v.setLength(modelConfiguration.speed);
        }

        return true;
    }

    // the escorted shuttle is the fixed intercept target — that's the whole
    // point of the run — so keep flying at and firing on it as long as it's
    // alive. Only fall back to the player once the shuttle's gone, so the
    // flight doesn't just idle with no target.
    function pickTarget() {
        const escort = getShipByDesignation(modelConfiguration.escortTarget);
        if(isAlive(escort)) return escort;

        const player = getPlayer();
        return isAlive(player) ? player : null;
    }

    const FIRE_RANGE = 750; // fire from farther out rather than waiting until right on top of the target
    const FIRE_COS_ANGLE = 0.8; // ~37 degrees off boresight counts as "aimed" — wider cone opens fire sooner in the approach
    const ATTACK_ARRIVE_THRESHOLD = 30;
    const EGRESS_ARRIVE_THRESHOLD = 40;
    const EGRESS_RADIUS = 180; // just far enough to break the pass and turn back in, not a long disengage

    function isAimedAt(target) {
        if(!target || distanceTo(modelGroup, target) > FIRE_RANGE) return false;

        const matrix = new THREE.Matrix4().makeRotationFromEuler(modelGroup.rotation);
        const forward = new THREE.Vector3(0, 0, 1).applyMatrix4(matrix).normalize();
        const toTarget = new THREE.Vector3().subVectors(target.position, modelGroup.position).normalize();

        return forward.dot(toTarget) > FIRE_COS_ANGLE;
    }

    // a point continuing straight through/past the target's CURRENT position,
    // fixed at the moment the attack run starts — flying at a fixed point
    // beyond the target, rather than re-aiming at its live position every
    // frame, is what turns this into an actual strafing run. Chasing the
    // live position every frame (the old approach) degenerates into pure
    // pursuit, which just orbits tightly around a target that's slow or
    // stationary (e.g. the shuttle sitting docked) instead of passing by it.
    function getAttackWaypoint(target) {
        if(!target) return null;

        const toTarget = new THREE.Vector3().subVectors(target.position, modelGroup.position);
        const dist = toTarget.length();
        toTarget.normalize();

        const clearance = 150 + Math.random() * 100;
        const farPoint = modelGroup.position.clone().addScaledVector(toTarget, dist + clearance);

        // small lateral/vertical jitter so repeated passes don't all thread
        // the exact same line
        const perp = new THREE.Vector3(-toTarget.z, 0, toTarget.x);
        farPoint.addScaledVector(perp, (Math.random() - 0.5) * 60);
        farPoint.y += (Math.random() - 0.5) * 40;

        return farPoint;
    }

    // fly well clear of the target before looping back for another pass —
    // re-picking a new attack waypoint immediately after the old one is
    // reached would just turn back into tight circling
    function getEgressWaypoint(target) {
        if(!target) return null;

        const center = target.position;
        const angle = Math.random() * Math.PI * 2;
        const radius = EGRESS_RADIUS + Math.random() * 80;

        return new THREE.Vector3(
            center.x + Math.cos(angle) * radius,
            center.y + (Math.random() - 0.5) * 120,
            center.z + Math.sin(angle) * radius
        );
    }

    const APPROACH_ARRIVE_THRESHOLD = 150;
    const WITHDRAW_ARRIVE_THRESHOLD = 150;

    let attackWaypoint = null;
    let egressWaypoint = null;

    fsm = new FiniteStateMachine({

        // holds station off at the system's edge, hidden and off the
        // targeting scope (see ModelLoader's arrived flag), until the
        // escorted shuttle is cleared to launch
        holding: {
            enter: () => {
                console.log(`${modelGroup.designation} X-WING entering HOLDING — awaiting intercept order`);
                modelConfiguration.flight = null;
            },
            update: () => {}
        },

        // the initial "hyperspace in" leg — heads for the transport
        // (spawnTrigger's ship) rather than the shuttle's live position,
        // specifically to avoid flying straight at the ISD the shuttle is
        // still parked at when this begins (see the top-of-file comment)
        approach: {
            enter: () => {
                console.log(`${modelGroup.designation} X-WING entering APPROACH`);
                const anchor = getShipByDesignation(modelConfiguration.spawnTrigger);
                if(anchor) {
                    const initialVelocity = new THREE.Vector3()
                        .subVectors(anchor.position, modelGroup.position)
                        .normalize()
                        .multiplyScalar(modelConfiguration.speed);
                    modelConfiguration.flight = { velocity: initialVelocity, currentBank: 0 };
                }
            },
            update: () => {
                if(handleShipCollision()) return;

                const anchor = getShipByDesignation(modelConfiguration.spawnTrigger);
                if(!anchor) { fsm.transition("attack"); return; }

                NpcControls(scene, modelGroup, modelConfiguration, "flightUpdate", -1, cm, audio, laser, anchor);

                if(modelGroup.position.distanceTo(anchor.position) < APPROACH_ARRIVE_THRESHOLD) {
                    fsm.transition("attack");
                }
            }
        },

        attack: {
            enter: () => {
                console.log(`${modelGroup.designation} X-WING entering ATTACK`);
                attackWaypoint = getAttackWaypoint(pickTarget());

                // align the heading immediately instead of leaving it to
                // flightUpdate's slow turn-rate to catch up — starting the
                // run already aimed gives it room to fire before passing
                if(attackWaypoint) {
                    const initialVelocity = new THREE.Vector3()
                        .subVectors(attackWaypoint, modelGroup.position)
                        .normalize()
                        .multiplyScalar(modelConfiguration.speed);
                    modelConfiguration.flight = { velocity: initialVelocity, currentBank: 0 };
                }
            },
            update: () => {
                if(handleShipCollision()) return;

                const target = pickTarget();
                if(!target) return;

                if(!attackWaypoint) attackWaypoint = getAttackWaypoint(target);

                NpcControls(scene, modelGroup, modelConfiguration, "flightUpdate", -1, cm, audio, laser, attackWaypoint);

                if(isAimedAt(target)) {
                    // re-checked before each shot in the burst, so it stops firing
                    // if the target slips out of the cone mid-burst
                    NpcControls(scene, modelGroup, modelConfiguration, "burstFire", -1, cm, audio, laser,
                        () => isAimedAt(target));
                }

                if(attackWaypoint && modelGroup.position.distanceTo(attackWaypoint) < ATTACK_ARRIVE_THRESHOLD) {
                    fsm.transition("egress");
                }
            }
        },

        egress: {
            enter: () => {
                console.log(`${modelGroup.designation} X-WING entering EGRESS`);
                egressWaypoint = getEgressWaypoint(pickTarget());
            },
            update: () => {
                if(handleShipCollision()) return;

                if(!egressWaypoint) {
                    fsm.transition("attack");
                    return;
                }

                NpcControls(scene, modelGroup, modelConfiguration, "flightUpdate", -1, cm, audio, laser, egressWaypoint);

                if(modelGroup.position.distanceTo(egressWaypoint) < EGRESS_ARRIVE_THRESHOLD) {
                    fsm.transition("attack");
                }
            }
        },

        // the shuttle made it home safe with the rebels — break off and
        // return to the point this flight originally hyperspaced in from,
        // then jump out (see the SHUTTLE_DOCKED subscription below)
        withdraw: {
            enter: () => {
                console.log(`${modelGroup.designation} X-WING entering WITHDRAW — returning to hyperspace point`);

                // gated to one ship so the flight's three fighters don't each
                // pop their own duplicate toast — same convention as the
                // arrival toast/FighterFSM's logEvent
                if(modelGroup.designation === 'RED_LEADER') {
                    showToast('REBEL X-WINGS RETREATING — BREAKING OFF ATTACK');
                }

                // S-foils closed for the cruise back to the hyperspace point
                wingsUp();

                const home = modelConfiguration.position;
                const target = new THREE.Vector3(home.x, home.y, home.z);
                const initialVelocity = new THREE.Vector3()
                    .subVectors(target, modelGroup.position)
                    .normalize()
                    .multiplyScalar(modelConfiguration.speed);
                modelConfiguration.flight = { velocity: initialVelocity, currentBank: 0 };
            },
            update: () => {
                if(handleShipCollision()) return;

                const home = modelConfiguration.position;
                const target = new THREE.Vector3(home.x, home.y, home.z);
                NpcControls(scene, modelGroup, modelConfiguration, "flightUpdate", -1, cm, audio, laser, target);

                if(modelGroup.position.distanceTo(target) < WITHDRAW_ARRIVE_THRESHOLD) {
                    console.log(`${modelGroup.designation} X-WING departed — jumping to hyperspace`);
                    modelGroup.visible = false;
                    modelGroup.arrived = false;
                    fsm.transition("departed");
                }
            }
        },

        // gone for good — left on the targeting scope's exclusion list and
        // out of the render, same as a ship that hasn't hyperspaced in yet
        departed: {
            enter: () => {
                modelConfiguration.flight = null;
            },
            update: () => {}
        },

    }, "holding");

    EventBus.subscribe(events.SHUTTLE_DOCKED, ({ designation }) => {
        if(runId !== latestRunIdByDesignation.get(modelGroup.designation)) return;
        if(designation !== modelConfiguration.escortTarget) return;
        if(fsm.state === 'holding' || fsm.state === 'withdraw' || fsm.state === 'departed') return;

        fsm.transition('withdraw');
    });

    EventBus.subscribe(events.TARGET_IDENTIFIED, ({ designation }) => {
        if(runId !== latestRunIdByDesignation.get(modelGroup.designation)) return;
        if(fsm.state !== 'holding' || designation !== modelConfiguration.spawnTrigger) return;

        // the "hyperspace in" reveal — becomes visible and enters the
        // targeting scope at the exact moment it starts moving
        modelGroup.visible = true;
        modelGroup.arrived = true;

        // S-foils into attack position — same play-half-of-"Take 01" trick
        // ModelLoader wires up for the shuttle's wings
        wingsDown();

        // gated to one ship so the flight's three fighters don't each pop
        // their own duplicate toast — same convention as FighterFSM's logEvent
        if(modelGroup.designation === 'RED_LEADER') {
            showToast('WARNING: REBEL X-WINGS DETECTED — INTERCEPT COURSE');
        }

        fsm.transition('approach');
    });

    return fsm;
};
