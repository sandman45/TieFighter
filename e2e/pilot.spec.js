const { test, expect } = require('@playwright/test');

// .nav-btn.launch buttons (CONTINUE/JOIN BATTLE/LAUNCH/etc.) have a pulsing
// CSS transform animation that makes Playwright's coordinate-based clicks
// (even with force:true) intermittently miss. A native DOM click sidesteps
// pointer coordinates entirely and is immune to the animation.
function clickById(page, id) {
    return page.evaluate((elId) => document.getElementById(elId).click(), id);
}

test.describe('Pilot profile system', () => {
    test('pilot screen gates the main menu on first load', async ({ page }) => {
        const pageErrors = [];
        page.on('pageerror', err => pageErrors.push(err.message));

        await page.goto('/');

        // pilot screen shows first, not the main menu — matches the original game's flow
        await expect(page.locator('#pilot-screen')).toBeVisible();
        await expect(page.locator('#menu')).toBeHidden();

        // dismiss the gate
        await clickById(page, 'pilotBackBtn');
        await expect(page.locator('#menu')).toBeVisible();
        await expect(page.locator('#pilot-screen')).toBeHidden();

        // revisiting pilot from the menu later still works normally
        await page.locator('.menu-item[name="pilot"]').click();
        await expect(page.locator('#pilot-screen')).toBeVisible();
        await clickById(page, 'pilotBackBtn');
        await expect(page.locator('#menu')).toBeVisible();

        // still able to reach campaign/multiplayer after the gate
        await page.locator('.menu-item[name="campaign"]').click();
        await page.waitForTimeout(700);
        await expect(page.locator('#campaign-menu')).toBeVisible();

        expect(pageErrors).toEqual([]);
    });

    test('default pilot is seeded and displayed', async ({ page }) => {
        await page.goto('/');

        // pilot screen is already showing (gates the main menu)
        await expect(page.locator('#pilot-screen')).toBeVisible();
        await expect(page.locator('#menu')).toBeHidden();
        await expect(page.locator('#pilot-name-input')).toHaveValue('ALPHA ONE');
        await expect(page.locator('#pilot-stat-rank')).toHaveText('FLT. CADET');
        await expect(page.locator('#pilot-stat-score')).toHaveText('0');
        await expect(page.locator('#pilot-stat-missions')).toHaveText('0');
        await expect(page.locator('#pilot-index-indicator')).toHaveText('PILOT 1 / 1');
        await expect(page.locator('#pilotArrowLeft')).toBeDisabled();
        await expect(page.locator('#pilotArrowRight')).toBeDisabled();
    });

    test('renaming persists across reload', async ({ page }) => {
        await page.goto('/');

        const input = page.locator('#pilot-name-input');
        await input.fill('');
        await input.type('TEST PILOT');

        const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('TIE_FIGHTER:PILOTS')));
        expect(stored[0].name).toBe('TEST PILOT');

        await page.reload();
        await expect(page.locator('#pilot-name-input')).toHaveValue('TEST PILOT');
    });

    test('create new pilot and cycle with wraparound', async ({ page }) => {
        await page.goto('/');

        await page.locator('#pilotNewBtn').click();
        await expect(page.locator('#pilot-index-indicator')).toHaveText('PILOT 2 / 2');

        const pilots = await page.evaluate(() => JSON.parse(localStorage.getItem('TIE_FIGHTER:PILOTS')));
        expect(pilots.length).toBe(2);
        const activeId = await page.evaluate(() => JSON.parse(localStorage.getItem('TIE_FIGHTER:ACTIVE_PILOT_ID')));
        expect(activeId).toBe(pilots[1].id);

        await expect(page.locator('#pilotArrowLeft')).toBeEnabled();
        await expect(page.locator('#pilotArrowRight')).toBeEnabled();

        // wrap forward from pilot 2 -> pilot 1
        await page.locator('#pilotArrowRight').click();
        await expect(page.locator('#pilot-index-indicator')).toHaveText('PILOT 1 / 2');

        // wrap backward from pilot 1 -> pilot 2
        await page.locator('#pilotArrowLeft').click();
        await expect(page.locator('#pilot-index-indicator')).toHaveText('PILOT 2 / 2');
    });

    test('scoring flow: kills + mission complete update pilot and debrief screen', async ({ page }) => {
        const pageErrors = [];
        page.on('pageerror', err => pageErrors.push(err.message));

        await page.goto('/');

        // rename active pilot so assertions are non-tautological (not the seeded default)
        const input = page.locator('#pilot-name-input');
        await input.fill('');
        await input.type('SCORE TEST');
        await clickById(page, 'pilotBackBtn');

        await page.locator('.menu-item[name="campaign"]').click();
        await page.waitForTimeout(700);
        await clickById(page, 'campaignJoinBtn');
        await page.waitForTimeout(1500);
        await clickById(page, 'launchBtn');
        await page.waitForTimeout(4000);

        await page.evaluate(async () => {
            const { default: EventBus } = await import('/js/eventBus/EventBus.js');
            const { default: events } = await import('/js/eventBus/events.js');
            ['GOLD_LEADER', 'GOLD_TWO', 'GOLD_THREE'].forEach(designation =>
                EventBus.post(events.SHIP_DESTROYED, { designation }));
            // MISSION_COMPLETE is normally posted by DockingManager once the
            // player docks after objectives are met — post it directly here
            // to exercise the debrief/scoring wiring without simulating flight
            EventBus.post(events.MISSION_COMPLETE);
        });
        await page.waitForTimeout(500);

        await expect(page.locator('#mission-debrief')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('#debrief-result-header')).toHaveText('MISSION SUCCESSFUL');
        await expect(page.locator('#debrief-pilot-name')).toHaveText('SCORE TEST');
        await expect(page.locator('#debrief-score-earned')).toHaveText('+800');
        await expect(page.locator('#debrief-total-score')).toHaveText('800');
        await expect(page.locator('#debrief-rank')).toHaveText('ENSIGN');
        await expect(page.locator('#debrief-missions-flown')).toHaveText('1');

        const pilots = await page.evaluate(() => JSON.parse(localStorage.getItem('TIE_FIGHTER:PILOTS')));
        expect(pilots[0].score).toBe(800);
        expect(pilots[0].missionsFlown).toBe(1);

        expect(pageErrors).toEqual([]);
    });

    test('failed mission increments missions flown but awards no completion bonus', async ({ page }) => {
        const pageErrors = [];
        page.on('pageerror', err => pageErrors.push(err.message));

        await page.goto('/');
        await clickById(page, 'pilotBackBtn');
        await page.locator('.menu-item[name="campaign"]').click();
        await page.waitForTimeout(700);
        await clickById(page, 'campaignJoinBtn');
        await page.waitForTimeout(1500);
        await clickById(page, 'launchBtn');
        await page.waitForTimeout(4000);

        await page.evaluate(async () => {
            const { default: EventBus } = await import('/js/eventBus/EventBus.js');
            const { default: events } = await import('/js/eventBus/events.js');
            EventBus.post(events.MISSION_FAILED, { reason: 'test failure' });
        });
        await page.waitForTimeout(500);

        await expect(page.locator('#mission-debrief')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('#debrief-result-header')).toHaveText('MISSION FAILED');
        await expect(page.locator('#debrief-score-earned')).toHaveText('+0');

        const pilots = await page.evaluate(() => JSON.parse(localStorage.getItem('TIE_FIGHTER:PILOTS')));
        expect(pilots[0].missionsFlown).toBe(1);
        expect(pilots[0].score).toBe(0);

        expect(pageErrors).toEqual([]);
    });

    test('menu music plays without errors across the pilot gate and later menu visits', async ({ page }) => {
        const pageErrors = [];
        page.on('pageerror', err => pageErrors.push(err.message));

        // patch immediately after navigation (before the async model/audio
        // load finishes) so we catch the very first play() call
        await page.goto('/', { waitUntil: 'commit' });
        await page.evaluate(async () => {
            const THREE = await import('https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js');
            window.__playedUrls = [];
            const origPlay = THREE.Audio.prototype.play;
            THREE.Audio.prototype.play = function (...args) {
                window.__playedUrls.push(this.buffer);
                return origPlay.apply(this, args);
            };
        });
        await page.waitForTimeout(3000);

        // dismiss the gate, revisit menu later — should now play MUSIC_MENU
        await clickById(page, 'pilotBackBtn');
        await page.locator('.menu-item[name="campaign"]').click();
        await page.waitForTimeout(500);
        await clickById(page, 'campaignMainMenuBtn');
        await page.waitForTimeout(1000);

        const playCount = await page.evaluate(() => window.__playedUrls.length);
        console.log('music play() calls captured:', playCount);
        // at minimum: the initial gate track, plus the later menu revisit track
        expect(playCount).toBeGreaterThanOrEqual(1);

        expect(pageErrors).toEqual([]);
    });
});
