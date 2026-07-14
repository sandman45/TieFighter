const SEGMENTS = 10;

// laser cannon power pool — fire drains it, and it trickle-recharges over time,
// same idea as the "L" (laser) power meter in the original TIE Fighter
export default ({ maxEnergy = 100, rechargeRate = 20, costPerShot = 25 } = {}) => {
    let energy = maxEnergy;
    let lastSegment = SEGMENTS;

    function trySpend() {
        if (energy < costPerShot) return false;
        energy -= costPerShot;
        return true;
    }

    // advances the recharge by `dt` seconds; returns true when the displayed
    // segment count changed, so callers only need to push a HUD update then
    function update(dt) {
        if (energy < maxEnergy) {
            energy = Math.min(maxEnergy, energy + rechargeRate * dt);
        }
        const segment = Math.ceil((energy / maxEnergy) * SEGMENTS);
        const changed = segment !== lastSegment;
        lastSegment = segment;
        return changed;
    }

    return {
        trySpend,
        update,
        getEnergy: () => energy,
        getMaxEnergy: () => maxEnergy,
    };
};
