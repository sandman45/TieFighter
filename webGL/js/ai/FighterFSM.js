import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import FiniteStateMachine from "./FiniteStateMachine.js";
import NpcControls from "../controls/NpcControls.js";

export default ({ scene, modelGroup, modelConfiguration, collisionManager, audio, laser }) => {
    const cm = collisionManager;
    let fsm;

    // gated to one ship for now so the console isn't flooded by all three
    // Y-Wings at once — change/remove the designation check to widen this
    function logEvent(msg) {
        if(modelGroup.designation === 'GOLD_LEADER') {
            console.log(`[${modelGroup.designation}] ${msg}`);
        }
    }

    function vecStr(v) {
        return v ? `(${v.x.toFixed(0)}, ${v.y.toFixed(0)}, ${v.z.toFixed(0)})` : 'null';
    }

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
            // the ISD is enormous — "distance to it" should mean distance to its
            // nearest hull surface, not its center, so fighters can engage whichever
            // part of the ship happens to be facing them rather than one fixed point
            return distanceToISDSurface(meshA, meshB);
        }
        return meshA.position.distanceTo(meshB.position);
    }

    function distanceToISDSurface(mesh, isd) {
        const box = new THREE.Box3().setFromObject(isd);
        const closest = new THREE.Vector3();
        box.clampPoint(mesh.position, closest);
        return mesh.position.distanceTo(closest);
    }

    // let a fighter fire only when a shot along its actual firing direction
    // (same convention LaserCannons.js uses) would genuinely connect with the
    // ISD's real hull geometry within weapons range. This raycasts against the
    // actual mesh triangles — same as LaserCannons.js's own precise hit test —
    // rather than the ISD's axis-aligned bounding box. The ISD is a wedge shape,
    // so its Box3 is necessarily much bigger than the visible hull (it has to
    // cover the full angled/tapered extent plus the bridge tower and nacelles),
    // which meant a ray could satisfy ray-vs-box while visually pointed at
    // empty space next to the ship — a hit on the invisible box, not the ship.
    function canHitISD(mesh, isd, maxRange) {
        // quick reject via the (cheap) bounding box before the precise raycast
        const box = new THREE.Box3().setFromObject(isd);
        const closest = new THREE.Vector3();
        box.clampPoint(mesh.position, closest);
        if(mesh.position.distanceTo(closest) >= maxRange) return false;

        // build the rotation matrix from the mesh's live .rotation, NOT .matrix —
        // .matrix is only refreshed during the render pass (updateMatrixWorld),
        // which runs after this tick's flightUpdate already changed .rotation,
        // so reading .matrix here would check last frame's heading, not this one
        const matrix = new THREE.Matrix4().makeRotationFromEuler(mesh.rotation);
        const fireDir = new THREE.Vector3(0, 0, 1).applyMatrix4(matrix).normalize();

        const raycaster = new THREE.Raycaster(mesh.position.clone(), fireDir, 0, maxRange);
        const meshesToCheck = [];
        isd.traverse(child => {
            if(child.isMesh) meshesToCheck.push(child);
        });

        return raycaster.intersectObjects(meshesToCheck, false).length > 0;
    }

    // how far a fighter is allowed to sit inside the ISD's hull box before
    // avoidance kicks in — shrinking the box by this amount means avoidance
    // only triggers once genuinely deep inside, not the instant it touches
    // the outer edge, allowing closer/tighter passes near the hull
    const HULL_TOLERANCE = 30;

    // keeps a fighter from ever ending up too far inside the ISD's hull box —
    // pushes it back out to the tolerance boundary and reflects the inward velocity
    function avoidISDHull(isd) {
        if(!isd) return false;
        const box = new THREE.Box3().setFromObject(isd);
        box.expandByScalar(-HULL_TOLERANCE);
        if(!box.containsPoint(modelGroup.position)) return false;

        logEvent('too deep inside the ISD hull — pushing back out');

        const closest = new THREE.Vector3();
        box.clampPoint(modelGroup.position, closest);

        const normal = new THREE.Vector3().subVectors(modelGroup.position, closest);
        if(normal.lengthSq() < 1e-6) {
            normal.subVectors(modelGroup.position, getISDCenter(isd));
        }
        normal.normalize();

        modelGroup.position.copy(closest).addScaledVector(normal, 5);

        if(modelConfiguration.flight && modelConfiguration.flight.velocity) {
            const v = modelConfiguration.flight.velocity;
            const dot = v.dot(normal);
            // clip the inward component instead of bouncing off it — the ship
            // slides along the hull rather than jerking back the way it came
            if(dot < 0) v.addScaledVector(normal, -dot);
        }

        return true;
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

    function getAttackWaypoint(isd, fromPosition) {
        if(!isd) return null;
        const center = getISDCenter(isd);
        const size   = getISDSize(isd);
        const clearance = Math.max(size.x, size.z) / 2 + 400;

        if(fromPosition) {
            // aim straight at the ISD and continue out the far side — this
            // guarantees the pass threads close by the hull. An earlier version
            // picked the far waypoint with a wide (±63°) ANGULAR jitter around
            // the far-side bearing, but at long range even a modest angular
            // error becomes a huge lateral miss, so the ship would swing wide
            // around the ISD and never come close enough to actually fire.
            // A small FIXED-DISTANCE lateral offset instead keeps every pass
            // within a predictable distance of the hull regardless of how far
            // out the ship currently is
            const toCenter = new THREE.Vector3().subVectors(center, fromPosition);
            const distToCenter = toCenter.length();
            toCenter.normalize();

            const farPoint = fromPosition.clone().addScaledVector(toCenter, distToCenter + clearance);

            // the ISD is a tapered wedge — its actual mesh presents a much
            // narrower cross-section head-on than its bounding box (which has
            // to cover the full wingspan/length). A wide lateral offset here
            // reliably clears the coarse box-based range check but can miss
            // the real, narrower hull silhouette from a distance — which is
            // exactly why shots were only connecting once right on top of it.
            // Keep the jitter small so the pass threads through the actual hull
            const perp = new THREE.Vector3(-toCenter.z, 0, toCenter.x);
            farPoint.addScaledVector(perp, (Math.random() - 0.5) * 60); // ±30 units
            farPoint.y = center.y + (Math.random() - 0.5) * (size.y / 2 + 100);

            return farPoint;
        }

        // no known ship position (e.g. legacy callers) — fall back to a random
        // point on the safety ring around the ISD
        const angle = Math.random() * Math.PI * 2;
        const spread = 1 + Math.random() * 0.4;

        return new THREE.Vector3(
            center.x + Math.cos(angle) * clearance * spread,
            center.y + (Math.random() - 0.5) * (size.y / 2 + 150),
            center.z + Math.sin(angle) * clearance * spread
        );
    }

    function getEgressWaypoint(isd) {
        if(!isd) return null;
        const center = getISDCenter(isd);
        const size   = getISDSize(isd);

        // fly well clear of the ISD before looping back for another attack run —
        // re-picking a nearby attack waypoint immediately after every pass was
        // forcing sharp direction reversals right next to the hull
        const radius = Math.max(size.x, size.z) / 2 + 500;
        const angle  = Math.random() * Math.PI * 2;

        return new THREE.Vector3(
            center.x + Math.cos(angle) * radius,
            center.y + (Math.random() - 0.5) * 80,
            center.z + Math.sin(angle) * radius
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

        logEvent('ship-to-ship collision — bouncing off');

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

    const FORM_RANGE     = 2000;
    const ATTACK_RANGE   = 2000;
    const THREAT_RANGE   = 200;
    const EVADE_DURATION = 10000;
    const EVADE_COOLDOWN = 10000;

    let attackWaypoint = null;
    let egressing = false;
    let wasAimed = false;
    let evadeTarget = null;
    let evadeTimer = 0;
    let evadeCooldownUntil = 0;

    fsm = new FiniteStateMachine({

        form: {
            enter: () => {
                logEvent('entering FORM');
                modelConfiguration.flight = null;
            },
            update: () => {
                const isd = getISD();
                if(!isd) return;

                if(handleShipCollision(null)) return;

                // target the ship's visual center, not isd.position — the model's
                // pivot can sit well behind the hull the fighters should be flying at
                const collision = NpcControls(scene, modelGroup, modelConfiguration, "flightUpdate", -1, cm, audio, laser, getISDCenter(isd));
                avoidISDHull(isd);

                if(collision) {
                    modelGroup.position.add(
                        new THREE.Vector3()
                            .subVectors(getISDCenter(isd), modelGroup.position)
                            .normalize()
                            .multiplyScalar(modelConfiguration.speed * 2)
                    );
                    modelConfiguration.flight = null;
                }

                if(distanceTo(modelGroup, isd) < FORM_RANGE) {
                    logEvent(`FORM_RANGE reached (${distanceTo(modelGroup, isd).toFixed(0)} units from hull) — transitioning to ATTACK`);
                    attackWaypoint = getAttackWaypoint(isd, modelGroup.position);
                    fsm.transition("attack");
                }
            }
        },

        attack: {
            enter: () => {
                logEvent('entering ATTACK');
                const isd = getISD();
                attackWaypoint = getAttackWaypoint(isd, modelGroup.position);
                egressing = false;
                logEvent(`picked attack waypoint ${vecStr(attackWaypoint)}`);

                // align the heading toward the attack waypoint immediately instead
                // of leaving it to flightUpdate's slow turn-rate to catch up from
                // whatever direction the ship happened to be flying before —
                // starting the run already aimed is what gives it room to fire
                // well before reaching the hull, now that FORM_RANGE begins the
                // run much farther out
                if(attackWaypoint) {
                    const initialVelocity = new THREE.Vector3()
                        .subVectors(attackWaypoint, modelGroup.position)
                        .normalize()
                        .multiplyScalar(modelConfiguration.speed);
                    modelConfiguration.flight = { velocity: initialVelocity, currentBank: 0 };
                }
            },
            update: () => {
                const isd = getISD();
                const player = getPlayer();
                if(!isd) return;

                if(handleShipCollision(getAttackWaypoint(isd, modelGroup.position))) return;

                if(player && distanceTo(modelGroup, player) < THREAT_RANGE && Date.now() > evadeCooldownUntil) {
                    logEvent('player threat detected — evading');
                    fsm.transition("evade");
                    return;
                }

                const target = attackWaypoint || getISDCenter(isd);
                const collision = NpcControls(scene, modelGroup, modelConfiguration, "flightUpdate", -1, cm, audio, laser, target);
                avoidISDHull(isd);

                if(collision) {
                    logEvent('surface collision while approaching — picking a new attack waypoint');
                    attackWaypoint = getAttackWaypoint(isd, modelGroup.position);
                    modelGroup.position.add(
                        new THREE.Vector3()
                            .subVectors(getISDCenter(isd), modelGroup.position)
                            .normalize()
                            .multiplyScalar(modelConfiguration.speed * 2)
                    );
                    modelConfiguration.flight = null;
                }

                const aimed = canHitISD(modelGroup, isd, ATTACK_RANGE);
                if(aimed && !wasAimed) {
                    logEvent(`ISD in sights at ${distanceTo(modelGroup, isd).toFixed(0)} units — opening fire`);
                } else if(!aimed && wasAimed) {
                    logEvent('lost the shot');
                }
                wasAimed = aimed;

                if(aimed) {
                    // re-checked before each shot in the burst, so it stops firing
                    // if the ship turns away mid-burst instead of shooting blind
                    NpcControls(scene, modelGroup, modelConfiguration, "burstFire", -1, cm, audio, laser,
                        () => canHitISD(modelGroup, isd, ATTACK_RANGE));
                }

                if(attackWaypoint && modelGroup.position.distanceTo(attackWaypoint) < 20) {
                    if(egressing) {
                        logEvent('egress point reached — turning back in to attack');
                        egressing = false;
                        attackWaypoint = getAttackWaypoint(isd, modelGroup.position);
                    } else {
                        logEvent('attack waypoint reached — egressing');
                        egressing = true;
                        attackWaypoint = getEgressWaypoint(isd);
                    }
                }
            }
        },

        evade: {
            enter: () => {
                logEvent('entering EVADE');
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
                avoidISDHull(getISD());

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
                logEvent('entering RETURN_TO_ATTACK');
                evadeCooldownUntil = Date.now() + EVADE_COOLDOWN;
                modelConfiguration.flight = null;
            },
            update: () => {
                const isd = getISD();
                if(!isd) return;

                if(handleShipCollision(null)) return;

                const collision = NpcControls(scene, modelGroup, modelConfiguration, "flightUpdate", -1, cm, audio, laser, getISDCenter(isd));
                avoidISDHull(isd);

                if(collision) {
                    modelGroup.position.add(
                        new THREE.Vector3()
                            .subVectors(getISDCenter(isd), modelGroup.position)
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
