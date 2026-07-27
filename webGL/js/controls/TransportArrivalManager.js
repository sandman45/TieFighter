import EventBus from "../eventBus/EventBus.js";
import events from "../eventBus/events.js";
import { showToast } from "../HUD/hud.js";

// The freighter convoy doesn't sit in the system for the whole mission — it
// hyperspaces in shortly after the player launches, and jumps back out once
// TYDERIAN's boarding run is fully finished (SHUTTLE_DOCKED — the same
// "run's actually over" signal InterceptorFSM uses to start its withdrawal).
// Transports have no FSM of their own (ModelLoader explicitly skips creating
// one for the TRANSPORT model), so this is what actually drives their
// arrival/departure rather than any per-ship logic.
const ARRIVE_DELAY_MS = 60000;

export default ({ transports, escortTrigger }) => {
    const startedAt = Date.now();
    let arrived = false;
    let departed = false;

    transports.forEach(mesh => {
        mesh.visible = false;
        mesh.arrived = false;
    });

    EventBus.subscribe(events.SHUTTLE_DOCKED, ({ designation }) => {
        if(departed || designation !== escortTrigger) return;
        departed = true;
        showToast('FREIGHTER CONVOY DEPARTING — TRANSFER COMPLETE');
        transports.forEach(mesh => {
            mesh.visible = false;
            mesh.arrived = false;
        });
    });

    function update() {
        if(arrived || departed) return;
        if(Date.now() - startedAt < ARRIVE_DELAY_MS) return;
        arrived = true;
        showToast('FREIGHTER CONVOY DETECTED — MULTIPLE CONTACTS INBOUND');
        transports.forEach(mesh => {
            mesh.visible = true;
            mesh.arrived = true;
        });
    }

    return { update };
};
