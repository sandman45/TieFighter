export const SHIP_RECHARGE_RATES = {
    // Imperial — TIE Bomber is the slowest (heavy ordnance ship), TIE Fighter
    // second-slowest (baseline, no shields but unremarkable tech), and the
    // Interceptor/Advanced/Defender are all superior imperial craft with
    // faster recharge than the plain Fighter.
    TIE_BOMBER:      { laserRechargeRate: 18 },
    TIE_FIGHTER:     { laserRechargeRate: 22 },
    TIE_ADVANCED:    { laserRechargeRate: 23, shieldRechargeRate: 4 },
    TIE_INTERCEPTOR: { laserRechargeRate: 25 },
    TIE_DEFENDER:    { laserRechargeRate: 27, shieldRechargeRate: 5 },
    // Rebel
    A_WING:          { laserRechargeRate: 22, shieldRechargeRate: 5 },
    X_WING:          { laserRechargeRate: 20, shieldRechargeRate: 4 },
    Y_WING:          { laserRechargeRate: 15, shieldRechargeRate: 3 },
    B_WING:          { laserRechargeRate: 17, shieldRechargeRate: 3 },
    // Non-combat / capital — deliberately below every fighter's laser rate
    SHUTTLE:         { laserRechargeRate: 12, shieldRechargeRate: 3 },
    TRANSPORT:       { laserRechargeRate: 12, shieldRechargeRate: 3 },
    ISD:             { laserRechargeRate: 10, shieldRechargeRate: 6 },
};

export const DEFAULT_LASER_RECHARGE_RATE = 20;
export const DEFAULT_SHIELD_RECHARGE_RATE = 0;

export function resolveLaserRechargeRate(modelConfiguration) {
    if (modelConfiguration.laserRechargeRate !== undefined) return modelConfiguration.laserRechargeRate;
    const rates = SHIP_RECHARGE_RATES[modelConfiguration.name];
    return (rates && rates.laserRechargeRate !== undefined) ? rates.laserRechargeRate : DEFAULT_LASER_RECHARGE_RATE;
}

export function resolveShieldRechargeRate(modelConfiguration) {
    if (modelConfiguration.shieldRechargeRate !== undefined) return modelConfiguration.shieldRechargeRate;
    const rates = SHIP_RECHARGE_RATES[modelConfiguration.name];
    return (rates && rates.shieldRechargeRate !== undefined) ? rates.shieldRechargeRate : DEFAULT_SHIELD_RECHARGE_RATE;
}
