const { test, expect } = require('@playwright/test');

test('loads the main menu with no console errors', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.goto('/');

    await expect(page.locator('.menu-title')).toHaveText('IMPERIAL COMBAT SIMULATOR');
    await expect(page.locator('#canvas')).toBeVisible();
    expect(pageErrors).toEqual([]);
});

test('selecting multiplayer reveals the ship-select sub-menu', async ({ page }) => {
    await page.goto('/');

    await page.locator('.menu-item[name="shipselect"]').click();

    await expect(page.locator('#sub-menu')).toBeVisible();
    await expect(page.locator('#menu')).toBeHidden();
});
