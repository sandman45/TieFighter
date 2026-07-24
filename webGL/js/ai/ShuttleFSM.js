import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import FiniteStateMachine from "./FiniteStateMachine.js";
import NpcControls from "../controls/NpcControls.js";
import EventBus from "../eventBus/EventBus.js";
import events from "../eventBus/events.js";

// EventBus has no unsubscribe, and this factory re-subscribes on every mission
// (re)play — without a run guard, replaying the mission would stack duplicate
// closures, each capable of firing an old scene's fsm.transition (see the
// identical guard in MissionObjectives.js)
let latestRunId = 0;

export default ({ scene, modelGroup, modelConfiguration, collisionManager, audio, laser, wingsUp, wingsDown }) => {
    const runId = ++latestRunId;
    const cm = collisionManager;
    let fsm;

    // Shuttles with a dockTarget run a scripted round trip: start docked at the
    // ISD, wait for clearance, fly out and dock at the target, then fly back and
    // dock at the ISD for good. Shuttles without one keep the original ambient
    // behavior — an endless patrol loop docking at the ISD over and over.
    const scriptedDocking = !!modelConfiguration.dockTarget;

    function getShipByDesignation(designation) {
        if(!designation) return null;
        let found = null;
        scene.children.forEach(child => {
            if(child.designation === designation) found = child;
        });
        return found;
    }

    // older configs (e.g. the multiplayer shuttle) don't set homeDesignation,
    // so fall back to matching the one ISD in the scene by model name
    function getISDByName() {
        let isd = null;
        scene.children.forEach(child => {
            if(child.name === 'ISD') isd = child;
        });
        return isd;
    }

    function getHomeShip() {
        return modelConfiguration.homeDesignation
            ? getShipByDesignation(modelConfiguration.homeDesignation)
            : getISDByName();
    }

    function getTargetShip() {
        return getShipByDesignation(modelConfiguration.dockTarget);
    }

    // the ISD is scaled roughly 40x a transport, so its dock/patrol offsets
    // need to be an order of magnitude larger or the shuttle ends up hovering
    // deep inside the hull instead of alongside the docking bay
    function homePatrolY(ship) { return ship.position.y - 20; }
    function homeDockY(ship)   { return ship.position.y + 30; }
    function homePatrolZ(ship) { return ship.position.z - 20; }

    // docking-cycle offsets for TRANSPORT_A — the dock point needs to clear
    // the transport's hull (the GR-75 model is much bigger than its "scale: 1"
    // suggests), so the shuttle holds station clear of the ship rather than
    // flying into it. patrolY sits just under dockY (rather than well below
    // it, like the ISD's offsets do) so the DEPART/RETURN approach — which
    // passes close alongside the hull in X/Z on its way to/from the dock
    // point — stays above the hull the whole time instead of only clearing
    // it in the final RISE climb.
    function targetPatrolY(ship) { return ship.position.y + 8; }
    function targetDockY(ship)   { return ship.position.y + 10; }
    function targetPatrolZ(ship) { return ship.position.z - 5; }

    const ANCHOR = {
        home: {
            getShip: getHomeShip,
            patrolY: homePatrolY,
            dockY: homeDockY,
            patrolZ: homePatrolZ,
            riseZOffset: -80,
            waypointA: ship => new THREE.Vector3(ship.position.x + 1000, homePatrolY(ship), homePatrolZ(ship)),
            waypointB: ship => new THREE.Vector3(ship.position.x - 15, homePatrolY(ship), homePatrolZ(ship) - 80),
        },
        target: {
            getShip: getTargetShip,
            patrolY: targetPatrolY,
            dockY: targetDockY,
            patrolZ: targetPatrolZ,
            riseZOffset: -25,
            waypointA: ship => new THREE.Vector3(ship.position.x - 40, targetPatrolY(ship), targetPatrolZ(ship)),
            waypointB: ship => new THREE.Vector3(ship.position.x - 15, targetPatrolY(ship), targetPatrolZ(ship) - 20),
        },
    };

    function distanceTo(meshA, target) {
        if(!meshA || !target) return Infinity;
        const targetPos = target.isVector3 ? target : target.position;
        return meshA.position.distanceTo(targetPos);
    }

    const ARRIVE_THRESHOLD = 20;
    const HOME_DOCK_WAIT    = 20000; // legacy ambient patrol loop, unchanged
    const TARGET_DOCK_WAIT  = 60000; // ~1 minute alongside the boarded transport

    // which anchor the shuttle is currently docked at / currently flying toward
    let dockedAt = 'home';
    let headingTo = scriptedDocking ? null : 'home';
    let waypointA = null;
    let waypointB = null;
    let dockTimer = 0;
    let dockTimerActive = false;

    function initWaypoints(which) {
        if(!which || waypointA) return;
        const ship = ANCHOR[which].getShip();
        if(!ship) return;
        waypointA = ANCHOR[which].waypointA(ship);
        waypointB = ANCHOR[which].waypointB(ship);
    }

    function setHeadingTo(which) {
        headingTo = which;
        waypointA = null;
        waypointB = null;
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

        // shuttle sits docked at the ISD until the player has identified the
        // ship it's meant to board (the freighter suspected of carrying
        // rebel contraband) — only then is it cleared to launch
        holding: {
            enter: () => {
                console.log(`${modelGroup.designation} SHUTTLE entering HOLDING — awaiting inspection clearance`);
                modelConfiguration.flight = null;
            },
            update: () => {}
        },

        depart: {
            enter: () => {
                console.log(`${modelGroup.designation} SHUTTLE entering DEPART`);
                initWaypoints(headingTo);
                if(!modelConfiguration.flight) {
                    seedVelocityToward(waypointA);
                }
            },
            update: () => {
                initWaypoints(headingTo);
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
                initWaypoints(headingTo);
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
                const anchor = ANCHOR[headingTo];
                const ship = anchor && anchor.getShip();
                if(!ship) return;

                const riseTarget = new THREE.Vector3(
                    ship.position.x,
                    anchor.dockY(ship),
                    anchor.patrolZ(ship) + anchor.riseZOffset
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
                console.log(`${modelGroup.designation} SHUTTLE entering DOCKED at ${headingTo}`);
                dockedAt = headingTo;

                if(modelConfiguration.flight) {
                    modelConfiguration.flight.velocity.set(0, 0, 0);
                }

                if(!scriptedDocking) {
                    // legacy ambient loop: always heads back to the same anchor
                    setHeadingTo('home');
                    dockTimer = Date.now() + HOME_DOCK_WAIT;
                    dockTimerActive = true;
                } else if(dockedAt === 'target') {
                    setHeadingTo('home');
                    dockTimer = Date.now() + TARGET_DOCK_WAIT;
                    dockTimerActive = true;
                } else {
                    // back home for good — stay docked, no further departure
                    headingTo = null;
                    dockTimerActive = false;

                    // tells MissionObjectives the escort/boarding run is
                    // actually finished, not just that the transport was
                    // identified — the shuttle still has to make it home
                    if(scriptedDocking) {
                        EventBus.post(events.SHUTTLE_DOCKED, { designation: modelGroup.designation });

                        // the run is over — despawn shortly after so the
                        // docking itself is still visible for a moment
                        // rather than vanishing the instant it arrives.
                        // Reuses the same arrived flag ModelLoader/
                        // InterceptorFSM use to hide/exclude a ship from
                        // targeting, so the shuttle drops off the target
                        // cycle exactly like a ship that hasn't arrived yet.
                        setTimeout(() => {
                            if(runId !== latestRunId) return;
                            modelGroup.visible = false;
                            modelGroup.arrived = false;
                        }, 3000);
                    }
                }
            },
            update: () => {
                if(dockTimerActive && Date.now() > dockTimer) {
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
                // precompute the next leg's waypoints so LOWER can start
                // turning toward them while still descending off the dock
                initWaypoints(headingTo);

                // undocking from the boarded transport — the inspection party
                // is now aboard with the rebel sympathizers found on the manifest,
                // so the shuttle's own cargo readout should reflect its prisoners
                // for the trip home (see TARGET_IDENTIFIED / target-computer cargo readout)
                if(scriptedDocking && dockedAt === 'target') {
                    modelGroup.cargo = 'Captured Rebels';
                }
            },
            update: () => {
                const anchor = ANCHOR[dockedAt];
                const ship = anchor && anchor.getShip();
                if(!ship) return;

                const lowerTarget = new THREE.Vector3(
                    ship.position.x,
                    anchor.patrolY(ship),
                    anchor.patrolZ(ship) + anchor.riseZOffset
                );

                const dist = modelGroup.position.distanceTo(lowerTarget);

                if(dist > 1) {
                    const step = new THREE.Vector3()
                        .subVectors(lowerTarget, modelGroup.position)
                        .normalize()
                        .multiplyScalar(modelConfiguration.speed * 0.25);
                    modelGroup.position.add(step);
                }

                // rotate toward the next waypoint while lowering
                if(waypointA) {
                    const toWaypoint = new THREE.Vector3()
                        .subVectors(waypointA, modelGroup.position)
                        .normalize();
                    // nose is local -Z (see facingDir below / NpcControls.flightUpdate),
                    // so the target heading needs the same +PI flip those use —
                    // without it the shuttle turns to face directly away from
                    // the waypoint and flies off backwards
                    const targetYaw = Math.atan2(toWaypoint.x, toWaypoint.z) + Math.PI;
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
                initWaypoints(headingTo);
            },
            update: () => {
                initWaypoints(headingTo);
                if(!waypointA) return;

                const toWaypoint = new THREE.Vector3()
                    .subVectors(waypointA, modelGroup.position)
                    .normalize();
                // see the identical +PI note in LOWER above
                const targetYaw = Math.atan2(toWaypoint.x, toWaypoint.z) + Math.PI;

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

    }, scriptedDocking ? "holding" : "depart");

    EventBus.subscribe(events.TARGET_IDENTIFIED, ({ designation }) => {
        if(runId !== latestRunId) return;
        if(fsm.state !== 'holding' || designation !== modelConfiguration.dockTarget) return;
        setHeadingTo('target');
        fsm.transition('lower');
    });

    return fsm;
};
