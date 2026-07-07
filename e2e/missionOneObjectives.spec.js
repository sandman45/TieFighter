const { test, expect } = require('@playwright/test');

async function launchMissionOne(page) {
    await page.goto('/');
    await page.locator('.menu-item[name="campaign"]').click();
    await page.getByText('Mission One').click();
    await page.locator('#launchBtn').click();
    // the loading screen only hides after all ship models finish loading and
    // the mission scene (and its MissionObjectives subscription) has been built
    await page.locator('#loading').waitFor({ state: 'hidden', timeout: 30000 });
}

async function postShipDestroyed(page, designation) {
    await page.evaluate(async (d) => {
        const { default: EventBus } = await import('/js/eventBus/EventBus.js');
        const { default: events } = await import('/js/eventBus/events.js');
        EventBus.post(events.SHIP_DESTROYED, { designation: d });
    }, designation);
}

test('destroying all enemies shows the dock prompt and posting MISSION_COMPLETE ends the mission', async ({ page }) => {
    await launchMissionOne(page);

    await expect(page.locator('#dock-prompt')).toBeHidden();

    await postShipDestroyed(page, 'GOLD_LEADER');
    await postShipDestroyed(page, 'GOLD_TWO');
    await expect(page.locator('#mission-toast')).not.toHaveClass(/visible/);

    await postShipDestroyed(page, 'GOLD_THREE');
    await expect(page.locator('#mission-toast')).toHaveClass(/visible/);
    await expect(page.locator('#dock-prompt')).toBeVisible();

    await page.locator('#canvas').click({ force: true });
    await page.keyboard.press('g');

    await expect(page.locator('#mission-debrief')).toBeVisible();
    await expect(page.locator('#debrief-result-header')).toHaveText('MISSION SUCCESSFUL');

    await page.locator('#debriefReturnBtn').click();
    await expect(page.locator('#menu')).toBeVisible();
    await expect(page.locator('#mission-debrief')).toBeHidden();
});

test('destroying a protected ship fails the mission immediately, without waiting for all enemies', async ({ page }) => {
    await launchMissionOne(page);

    await postShipDestroyed(page, 'GOLD_LEADER');
    await postShipDestroyed(page, 'VICTORIOUS');

    await expect(page.locator('#mission-debrief')).toBeVisible();
    await expect(page.locator('#debrief-result-header')).toHaveText('MISSION FAILED');
    await expect(page.locator('#debrief-text')).toHaveText('Victorious was destroyed.');
});

test('the player\'s own ship being destroyed fails the mission', async ({ page }) => {
    await launchMissionOne(page);

    await postShipDestroyed(page, 'ALPHA_ONE');

    await expect(page.locator('#mission-debrief')).toBeVisible();
    await expect(page.locator('#debrief-result-header')).toHaveText('MISSION FAILED');
    await expect(page.locator('#debrief-text')).toHaveText('Your TIE Fighter was destroyed.');
});

test('pressing the dock key before objectives are met does nothing', async ({ page }) => {
    await launchMissionOne(page);

    await page.locator('#canvas').click({ force: true });
    await page.keyboard.press('g');
    await page.waitForTimeout(500);

    await expect(page.locator('#mission-debrief')).toBeHidden();
});
