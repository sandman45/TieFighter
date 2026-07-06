const { test, expect } = require('@playwright/test');

test('ship info panel reflects the currently viewed ship in multiplayer ship select', async ({ page }) => {
    await page.goto('/');
    await page.locator('.menu-item[name="shipselect"]').click();

    // wait for models to load and the initial selection to render
    await expect(page.locator('#shipInfoTitle')).toHaveText('TIE/LN FIGHTER', { timeout: 30000 });

    await page.locator('#arrowLeft').click();
    await expect(page.locator('#shipInfoTitle')).toHaveText('TIE/IN INTERCEPTOR', { timeout: 5000 });

    await page.locator('#arrowLeft').click();
    await expect(page.locator('#shipInfoTitle')).toHaveText('TIE ADVANCED x1', { timeout: 5000 });

    // the camera tween takes ~1s per step and drops input while moving,
    // so each click must wait for the previous step to land first
    await page.locator('#arrowRight').click();
    await expect(page.locator('#shipInfoTitle')).toHaveText('TIE/IN INTERCEPTOR', { timeout: 5000 });

    await page.locator('#arrowRight').click();
    await expect(page.locator('#shipInfoTitle')).toHaveText('TIE/LN FIGHTER', { timeout: 5000 });

    await page.locator('#arrowRight').click();
    await expect(page.locator('#shipInfoTitle')).toHaveText('RZ-1 A-WING', { timeout: 5000 });
});

test('ship info panel keeps updating while the INFO panel is open', async ({ page }) => {
    await page.goto('/');
    await page.locator('.menu-item[name="shipselect"]').click();

    await expect(page.locator('#shipInfoTitle')).toHaveText('TIE/LN FIGHTER', { timeout: 30000 });

    await page.locator('#infoBtn').click();
    await expect(page.locator('#shipInfoLeft')).toBeVisible({ timeout: 5000 });

    await page.locator('#arrowLeft').click();
    await expect(page.locator('#shipInfoTitle')).toHaveText('TIE/IN INTERCEPTOR', { timeout: 5000 });

    await page.locator('#arrowLeft').click();
    await expect(page.locator('#shipInfoTitle')).toHaveText('TIE ADVANCED x1', { timeout: 5000 });
});
