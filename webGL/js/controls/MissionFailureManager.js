import EventBus from "../eventBus/EventBus.js";
import events from "../eventBus/events.js";
import { showToast } from "../HUD/hud.js";

// When the ISD itself is destroyed there's no ship left to dock at and no
// way to end the mission by flying home (see DockingManager, which handles
// every other failure by letting the player return and dock). Instead of
// cutting straight to the debrief screen, drain the player's hull to zero
// over a few seconds — reads as "stranded with no rescue" rather than an
// unexplained instant game over — then destroy the player the same way
// WeaponsCollisionManager would for a combat kill, so MissionObjectives'
// normal player-destroyed handling ends the mission.
const DRAIN_TICK_MS = 400;
const DRAIN_AMOUNT = 7;

export default ({ scene, playerMesh, explosion, isdDesignation }) => {
    let draining = false;
    let nextTick = 0;

    EventBus.subscribe(events.MISSION_FAILED, ({ designation }) => {
        if(draining || designation !== isdDesignation || playerMesh.hull <= 0) return;
        draining = true;
        nextTick = Date.now() + DRAIN_TICK_MS;
        showToast('WITH THE VICTORIOUS LOST, THERE IS NO CHANCE OF RESCUE...');
    });

    function update() {
        if(!draining || playerMesh.hull <= 0 || Date.now() < nextTick) return;
        nextTick = Date.now() + DRAIN_TICK_MS;

        playerMesh.shields = 0;
        playerMesh.hull = Math.max(0, playerMesh.hull - DRAIN_AMOUNT);
        EventBus.post(events.PLAYER_DAMAGED, {
            shields: playerMesh.shields,
            maxShields: playerMesh.maxShields,
            hull: playerMesh.hull,
            maxHull: playerMesh.maxHull,
        });

        if(playerMesh.hull <= 0) {
            draining = false;
            explosion.trigger(playerMesh.position);
            EventBus.post(events.SHIP_DESTROYED, {
                userId: playerMesh.userId,
                designation: playerMesh.designation,
                name: playerMesh.name,
                faction: playerMesh.faction,
            });
            scene.remove(playerMesh);

            // MissionObjectives' own SHIP_DESTROYED handling won't fire a
            // second MISSION_FAILED here — it already ended the mission (and
            // set its runId guard) the moment the ISD went down. This is what
            // actually sends the player to the debrief screen once the drain
            // sequence finishes; main.js already has the ISD-loss reason
            // cached from that first MISSION_FAILED post.
            EventBus.post(events.MISSION_FAILED_RETURNED);
        }
    }

    return { update };
};
