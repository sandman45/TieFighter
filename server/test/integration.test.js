// Boots the real server as a child process against the real webGL
// static assets and hits it over HTTP/Socket.IO, the same way a
// browser would. Uses a non-default port so it doesn't collide with
// a server already running locally.
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const path = require('node:path');

const PORT = process.env.TEST_WEB_SERVER_PORT || 3050;
const BASE_URL = `http://localhost:${PORT}`;
const SERVER_SRC_DIR = path.join(__dirname, '..', 'src');

let serverProcess;

before(async () => {
    serverProcess = spawn(process.execPath, ['main.js'], {
        cwd: SERVER_SRC_DIR,
        env: { ...process.env, WEB_SERVER: String(PORT) },
        stdio: 'pipe'
    });

    await waitForServer(15000);
});

after(() => {
    if (serverProcess) serverProcess.kill();
});

async function waitForServer(timeoutMs) {
    const start = Date.now();
    let lastError;
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await fetch(BASE_URL + '/');
            if (res.ok) return;
        } catch (err) {
            lastError = err;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    throw new Error(`Server did not start within ${timeoutMs}ms: ${lastError}`);
}

test('serves the game index page', async () => {
    const res = await fetch(BASE_URL + '/');
    assert.strictEqual(res.status, 200);
    const body = await res.text();
    assert.match(body, /<title>WebGLScene<\/title>/);
});

test('serves the client bootstrap module', async () => {
    const res = await fetch(BASE_URL + '/js/main.js');
    assert.strictEqual(res.status, 200);
});

test('serves the global scene configuration', async () => {
    const res = await fetch(BASE_URL + '/sceneConfig.js');
    assert.strictEqual(res.status, 200);
});

test('serves stylesheets', async () => {
    const res = await fetch(BASE_URL + '/css/style.css');
    assert.strictEqual(res.status, 200);
});

test('serves a ship model', async () => {
    const res = await fetch(BASE_URL + '/models/tie-fighter/tie.glb');
    assert.strictEqual(res.status, 200);
});

test('serves the socket.io client library', async () => {
    const res = await fetch(BASE_URL + '/socket.io/socket.io.js');
    assert.strictEqual(res.status, 200);
});

test('completes a socket.io engine handshake', async () => {
    const res = await fetch(BASE_URL + '/socket.io/?EIO=3&transport=polling');
    assert.strictEqual(res.status, 200);
    const body = await res.text();
    assert.match(body, /"sid":"[^"]+"/);
    assert.match(body, /"upgrades":\["websocket"\]/);
});
