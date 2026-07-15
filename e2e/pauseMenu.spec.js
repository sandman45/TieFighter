const { test, expect } = require('@playwright/test');

// .nav-btn.launch buttons (JOIN BATTLE/LAUNCH/CONTINUE/etc.) have a pulsing
// CSS transform animation that makes Playwright's coordinate-based clicks
// (even with force:true) intermittently miss. A native DOM click sidesteps
// pointer coordinates entirely and is immune to the animation.
function clickById(page, id) {
    return page.evaluate((elId) => document.getElementById(elId).click(), id);
}

test.describe('Pause menu', () => {
    test('Esc during a mission opens the pause menu, not the campaign-select screen', async ({ page }) => {
        const pageErrors = [];
        page.on('pageerror', err => pageErrors.push(err.message));

        await page.goto('/');
        await expect(page.locator('#pilot-screen')).toBeVisible();
        await clickById(page, 'pilotBackBtn');
        await page.locator('.menu-item[name="campaign"]').click();
        await page.waitForTimeout(700);
        await clickById(page, 'campaignJoinBtn');
        await page.waitForTimeout(1500);
        await clickById(page, 'launchBtn');
        await page.waitForTimeout(5000);

        // Esc during gameplay -> pause menu, not the campaign-select screen
        await page.keyboard.press('Escape');
        await expect(page.locator('#pause-menu')).toBeVisible();
        await expect(page.locator('#campaign-menu')).toBeHidden();

        // Esc again toggles it closed
        await page.keyboard.press('Escape');
        await expect(page.locator('#pause-menu')).toBeHidden();

        expect(pageErrors).toEqual([]);
    });

    test('RESUME closes the pause menu and gameplay continues', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#pilot-screen')).toBeVisible();
        await clickById(page, 'pilotBackBtn');
        await page.locator('.menu-item[name="campaign"]').click();
        await page.waitForTimeout(700);
        await clickById(page, 'campaignJoinBtn');
        await page.waitForTimeout(1500);
        await clickById(page, 'launchBtn');
        await page.waitForTimeout(5000);

        await page.keyboard.press('Escape');
        await expect(page.locator('#pause-menu')).toBeVisible();
        await clickById(page, 'pauseResumeBtn');
        await expect(page.locator('#pause-menu')).toBeHidden();
        await expect(page.locator('#heads-up-display')).toBeVisible();
    });

    test('RETURN TO MAIN MENU exits the mission cleanly, and Esc no longer reopens the pause menu', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#pilot-screen')).toBeVisible();
        await clickById(page, 'pilotBackBtn');
        await page.locator('.menu-item[name="campaign"]').click();
        await page.waitForTimeout(700);
        await clickById(page, 'campaignJoinBtn');
        await page.waitForTimeout(1500);
        await clickById(page, 'launchBtn');
        await page.waitForTimeout(5000);

        await page.keyboard.press('Escape');
        await expect(page.locator('#pause-menu')).toBeVisible();
        await clickById(page, 'pauseQuitBtn');
        await page.waitForTimeout(500);

        await expect(page.locator('#pause-menu')).toBeHidden();
        await expect(page.locator('#menu')).toBeVisible();
        await expect(page.locator('#heads-up-display')).toBeHidden();

        // no longer "in mission" -- Esc should not reopen the pause menu
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
        await expect(page.locator('#pause-menu')).toBeHidden();
    });

    test('Esc still toggles sub-menu/campaign-menu normally outside of gameplay', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#pilot-screen')).toBeVisible();
        await clickById(page, 'pilotBackBtn');

        await page.locator('.menu-item[name="shipselect"]').click();
        await page.waitForTimeout(500);
        await expect(page.locator('#sub-menu')).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(page.locator('#sub-menu')).toBeHidden();
        await page.keyboard.press('Escape');
        await expect(page.locator('#sub-menu')).toBeVisible();
        await expect(page.locator('#pause-menu')).toBeHidden();
    });
});
