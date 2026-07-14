const { test, expect } = require('@playwright/test');

test('loads the pilot gate first, then the main menu with no console errors', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.goto('/');

    // pilot selection gates the main menu on first load, matching the original game
    await expect(page.locator('#pilot-screen')).toBeVisible();
    await expect(page.locator('#menu')).toBeHidden();

    await page.evaluate(() => document.getElementById('pilotBackBtn').click());

    await expect(page.locator('#menu .menu-title')).toHaveText('IMPERIAL COMBAT SIMULATOR');
    await expect(page.locator('#canvas')).toBeVisible();
    expect(pageErrors).toEqual([]);
});

test('selecting multiplayer reveals the ship-select sub-menu', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.getElementById('pilotBackBtn').click());

    await page.locator('.menu-item[name="shipselect"]').click();

    await expect(page.locator('#sub-menu')).toBeVisible();
    await expect(page.locator('#menu')).toBeHidden();
});
