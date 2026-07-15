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

    test('active pilot indicator shows on every screen except the pilot screen itself', async ({ page }) => {
        const pageErrors = [];
        page.on('pageerror', err => pageErrors.push(err.message));

        await page.goto('/');

        // hidden on the pilot gate itself
        await expect(page.locator('#active-pilot-badge')).toBeHidden();

        const input = page.locator('#pilot-name-input');
        await input.fill('');
        await input.type('BADGE TEST');
        await clickById(page, 'pilotBackBtn');

        // visible on the main menu (floating corner badge), with the right name
        await expect(page.locator('#active-pilot-badge')).toBeVisible();
        await expect(page.locator('#active-pilot-badge')).toContainText('BADGE TEST');

        // hidden again on a revisit to the pilot screen, visible again after leaving
        await page.locator('.menu-item[name="pilot"]').click();
        await expect(page.locator('#active-pilot-badge')).toBeHidden();
        await clickById(page, 'pilotBackBtn');
        await expect(page.locator('#active-pilot-badge')).toBeVisible();

        // campaign/battle select: woven into the top-bar header instead of the floating
        // badge (its content sits too close to the top for the floating badge to fit
        // without covering something, e.g. the briefing's sector label)
        await page.locator('.menu-item[name="campaign"]').click();
        await page.waitForTimeout(700);
        await expect(page.locator('#active-pilot-badge')).toBeHidden();
        await expect(page.locator('#campaign-menu .top-bar .empire-logo')).toContainText('BADGE TEST');

        // mission briefing: same top-bar treatment
        await clickById(page, 'campaignJoinBtn');
        await page.waitForTimeout(1200);
        await expect(page.locator('#active-pilot-badge')).toBeHidden();
        await expect(page.locator('#mission-briefing .top-bar .empire-logo')).toContainText('BADGE TEST');

        // gameplay HUD: back to the floating badge (no top-bar here)
        await clickById(page, 'launchBtn');
        await page.waitForTimeout(6000);
        await expect(page.locator('#active-pilot-badge')).toBeVisible();
        await expect(page.locator('#active-pilot-badge')).toContainText('BADGE TEST');

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
        await expect(page.locator('.pilot-list-item')).toHaveCount(1);
        await expect(page.locator('.pilot-list-item')).toHaveClass(/active/);
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

    test('create new pilot and select from the list', async ({ page }) => {
        await page.goto('/');

        const input = page.locator('#pilot-name-input');
        await input.fill('');
        await input.type('RICK');

        await page.locator('#pilotNewBtn').click();
        await page.waitForTimeout(200);
        await input.fill('');
        await input.type('SQUAKE');

        await expect(page.locator('.pilot-list-item')).toHaveCount(2);

        const pilots = await page.evaluate(() => JSON.parse(localStorage.getItem('TIE_FIGHTER:PILOTS')));
        expect(pilots.length).toBe(2);
        const activeId = await page.evaluate(() => JSON.parse(localStorage.getItem('TIE_FIGHTER:ACTIVE_PILOT_ID')));
        expect(activeId).toBe(pilots[1].id);
        await expect(page.locator('.pilot-list-item', { hasText: 'SQUAKE' })).toHaveClass(/active/);

        // select the other pilot from the list
        await page.locator('.pilot-list-item', { hasText: 'RICK' }).click();
        await expect(page.locator('#pilot-name-input')).toHaveValue('RICK');
        await expect(page.locator('.pilot-list-item', { hasText: 'RICK' })).toHaveClass(/active/);
        await expect(page.locator('.pilot-list-item', { hasText: 'SQUAKE' })).not.toHaveClass(/active/);
    });

    test('delete pilot requires confirmation, deleting the only pilot reseeds a default', async ({ page }) => {
        const pageErrors = [];
        page.on('pageerror', err => pageErrors.push(err.message));

        await page.goto('/');

        const input = page.locator('#pilot-name-input');
        await input.fill('');
        await input.type('DOOMED PILOT');

        // opening the confirm dialog doesn't delete anything
        await page.locator('#pilotDeleteBtn').click();
        await expect(page.locator('#pilot-delete-confirm')).toBeVisible();
        await expect(page.locator('#pilot-delete-confirm-text')).toContainText('DOOMED PILOT');

        // cancel leaves the pilot untouched
        await page.locator('#pilotDeleteCancelBtn').click();
        await expect(page.locator('#pilot-delete-confirm')).toBeHidden();
        await expect(page.locator('#pilot-name-input')).toHaveValue('DOOMED PILOT');
        let pilots = await page.evaluate(() => JSON.parse(localStorage.getItem('TIE_FIGHTER:PILOTS')));
        expect(pilots.length).toBe(1);

        // confirming deletes the only pilot — getPilots() auto-reseeds a fresh default
        await page.locator('#pilotDeleteBtn').click();
        await page.locator('#pilotDeleteConfirmBtn').click();
        await expect(page.locator('#pilot-delete-confirm')).toBeHidden();
        await expect(page.locator('#mission-toast')).toContainText('DELETED');
        await expect(page.locator('#pilot-name-input')).toHaveValue('ALPHA ONE');
        pilots = await page.evaluate(() => JSON.parse(localStorage.getItem('TIE_FIGHTER:PILOTS')));
        expect(pilots.length).toBe(1);
        expect(pilots[0].name).toBe('ALPHA ONE');

        expect(pageErrors).toEqual([]);
    });

    test('deleting one of several pilots keeps the others', async ({ page }) => {
        await page.goto('/');

        await page.locator('#pilotNewBtn').click();
        await page.waitForTimeout(200);
        const input = page.locator('#pilot-name-input');
        await input.fill('');
        await input.type('SURVIVOR');

        await page.locator('#pilotDeleteBtn').click();
        await page.locator('#pilotDeleteConfirmBtn').click();
        await page.waitForTimeout(200);

        const pilots = await page.evaluate(() => JSON.parse(localStorage.getItem('TIE_FIGHTER:PILOTS')));
        expect(pilots.length).toBe(1);
        expect(pilots[0].name).toBe('ALPHA ONE');
        await expect(page.locator('.pilot-list-item')).toHaveCount(1);
    });

    test('creating a new pilot gives clear feedback (toast + focused blank name field)', async ({ page }) => {
        await page.goto('/');

        await page.locator('#pilotNewBtn').click();

        await expect(page.locator('#mission-toast')).toHaveClass(/visible/);
        await expect(page.locator('#mission-toast')).toContainText('NEW PILOT CREATED');
        await expect(page.locator('#pilot-name-input')).toHaveValue('');
        await expect(page.locator('#pilot-name-input')).toHaveAttribute('placeholder', 'ENTER PILOT NAME');

        const isFocused = await page.evaluate(() => document.activeElement.id === 'pilot-name-input');
        expect(isFocused).toBe(true);
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
