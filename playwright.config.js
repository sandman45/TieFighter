const { defineConfig } = require('@playwright/test');

// Scratch port so this doesn't collide with a server you already have running locally.
const PORT = process.env.E2E_WEB_SERVER_PORT || 3060;

module.exports = defineConfig({
    testDir: './e2e',
    timeout: 30000,
    fullyParallel: false,
    reporter: 'list',
    webServer: {
        command: 'node main.js',
        cwd: 'server/src',
        url: `http://localhost:${PORT}/`,
        env: { WEB_SERVER: String(PORT) },
        reuseExistingServer: !process.env.CI,
        timeout: 15000
    },
    use: {
        baseURL: `http://localhost:${PORT}`,
        screenshot: 'only-on-failure',
        launchOptions: {
            // headless chromium needs a software GL fallback to create a WebGL context
            args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist']
        }
    }
});
