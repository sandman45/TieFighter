# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A Star Wars TIE Fighter browser game: a Three.js (WebGL) client with single-player campaign missions and a Socket.IO-based multiplayer mode, backed by a small Node/Express real-time server. There are two independent npm packages in this repo (`server/` and `webGL/`), tied together only by the root `package.json` orchestration scripts — they do not share `node_modules` or build tooling.

## Commands

Install dependencies for both sub-projects from the repo root:
```
npm run build
```
(equivalent to `cd server && npm i && cd ../webGL && npm i`; `install.bat` does the same on Windows.)

Before first run, create `server/src/.env` (gitignored, not committed) containing:
```
WEB_SERVER=3000
```

Run the server (must be launched from `server/src` — see Gotchas below):
```
cd server/src
node main
```
The Express server serves the compiled-free `webGL/` directory as static content and listens on `WEB_SERVER` from `.env`; open `http://localhost:<WEB_SERVER>/` in a browser to play.

Run the integration test suite (spawns the real server on a scratch port and hits it over HTTP/Socket.IO like a browser would):
```
npm test
```
(delegates to `cd server && npm test`, i.e. `node --test`, using Node's built-in test runner — no test framework dependency). The single test file is `server/test/integration.test.js`. To run it directly: `cd server && node --test test/integration.test.js`.

There is no linter configured anywhere in the repo.

## Architecture

### Server (`server/src/`)

- `main.js` — entrypoint. Loads `.env`, then starts `WebpageServer`. A raw TCP-socket transport (`TCPServer.js`) exists but is entirely commented out in `main.js` — it's legacy/dead code kept for reference; Socket.IO is the real transport.
- `WebpageServer.js` — Express + `http` + `socket.io` server. Serves `webGL/index.html` and static assets, and owns all realtime multiplayer state in an in-memory `gameState` object keyed by room name (no persistence — state is lost on restart). Handles room join/leave, ship-selection sync, game start, and per-tick position/state broadcast (`GAME_STATE`) to other players in the same room, plus disconnect cleanup.
- `events.js` — string-constant map of the socket event names the server understands. This is a separate, smaller file from the client's `webGL/js/eventBus/events.js` (which also has local-only UI events) — they are not shared/imported between server and client, just kept manually in sync by convention.

### Client (`webGL/`)

No bundler or build step: the browser loads plain ES modules directly (`<script type="module" src="./js/main.js">` in `index.html`). Three.js and `GLTFLoader` are imported by an absolute CDN URL (`https://threejsfundamentals.org/threejs/resources/threejs/r119/...`) at the top of nearly every file that touches THREE, rather than from `node_modules` — bumping the three.js version means updating this URL consistently across all of those files.

- `js/main.js` — bootstraps the app: wires DOM menu navigation (main menu → ship-select/campaign submenu → mission briefing → gameplay), keyboard/resize listeners, and drives the render loop via `requestAnimationFrame`, calling `sceneManager.update()` and `TWEEN.update()` each frame.
- `js/SceneManager.js` — factory keyed by a "screen" string (`menu`, `shipselect`, `multiplayer`, or a campaign mission key such as `missionOne`). Tears down the previous scene and builds the next one by loading assets through `Manager` and delegating to the matching scene builder. Owns the shared per-frame update loop: syncs the skybox to the camera, updates the targeting reticle, drives weapon collision checks, and renders both the main view and the HUD "target computer" mini-view.
- `js/scenes/{menu,campaign,multiplayer}/` — each scene module is a factory that builds a `THREE.Scene`, camera(s)/renderer(s), loads ships via `ModelLoader`, wires up `CollisionManager`/`WeaponsCollisionManager`, and returns `{ scene, camera, renderer, sceneSubjects, controls, weaponsCollision }` for `SceneManager` to consume.
- `js/utils/Manager.js` + `js/utils/ModelLoader.js` — asset preloading. `Manager` drives the `#loading` progress bar and hands loaded models to the scene's callback. `ModelLoader` maps ship names (`TIE_FIGHTER`, `X_WING`, `ISD`, `SHUTTLE`, etc.) to `.glb` files under `webGL/models/`, and for NPC ships attaches a per-ship `FiniteStateMachine` (fighters: `form` → `attack` → `evade` → `returnToAttack`; the shuttle: `depart` → `return` → `slowDown` → `rise` → `docked` → `lower` → `turnToDepart`) that drives `controls/NpcControls.js`.
- `js/campaignMenu/campaign.js` and `webGL/sceneConfig.js` hold per-mission ship rosters/weapons and global scene defaults (floor, skybox, audio, control scheme) respectively; both are normalized through `js/utils/SceneConfigUtils.js#parseConfiguration`.
- `js/SocketIO.js` bridges the local `EventBus` (`js/eventBus/EventBus.js`, a minimal pub/sub) to Socket.IO events shared with the server: room join/leave, ship selection, `GAME_STATE` position sync, opponent-disconnect handling.
- Player input is either `controls/PlayerControls.js` (basic) or `controls/FlyControls.js` (full flight model), selected via `sceneConfig.js`'s `controls.flightControls` flag; `controls/NpcControls.js` provides the equivalent movement primitives for FSM-driven AI ships.
- Collision handling is split in two: `controls/CollisionManager.js` for ship-vs-static-geometry (e.g. the floor), and `controls/WeaponsCollisionManager.js` for laser hit detection — both post to `EventBus` for HUD/explosion code to react to.
- `js/HUD/hud.js` + `js/HUD/targetingReticle.js` (in-flight shields/hull/target overlay) and `js/missionBriefing/missionBriefing.js` (pre-mission briefing screen) are DOM overlays driven by campaign config and `EventBus` events — they are not part of the THREE.js scene graph.

## Gotchas

- `WebpageServer.js` resolves its static-file path relative to `__dirname` (`../../../webGL`), so the server must be started from inside `server/src` (`node main`) — running it from another working directory breaks static asset serving.
- Multiplayer game state is entirely in-memory on the server; restarting the server drops all active rooms/players.
