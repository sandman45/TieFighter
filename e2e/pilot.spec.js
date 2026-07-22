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
        await expect(page.locator('#campaign-menu')).toBeVisible();

        expect(pageErrors).toEqual([]);
    });

    test('active pilot indicator shows on the main menu and is woven into the campaign top-bar', async ({ page }) => {
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

        // campaign/battle select: woven into the top-bar header instead of the floating
        // badge (its content sits too close to the top for the floating badge to fit
        // without covering something, e.g. the briefing's sector label) -- the other
        // top-bar screens (briefing, debrief) share this same treatment and aren't
        // separately re-checked here to keep this test to a couple of screens.
        await page.locator('.menu-item[name="campaign"]').click();
        await expect(page.locator('#campaign-menu')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('#active-pilot-badge')).toBeHidden();
        await expect(page.locator('#campaign-menu .top-bar .empire-logo')).toContainText('BADGE TEST');

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

});
