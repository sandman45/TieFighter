# Tie Fighter

A Star Wars TIE Fighter browser game: a Three.js (WebGL) client with
single-player campaign missions and a Socket.IO-based multiplayer mode,
backed by a small Node/Express real-time server.

Built starting from [PierfrancescoSoffritti's Configurable Three JS App
template](https://github.com/PierfrancescoSoffritti/configurable-threejs-app) —
check it out, he's done an amazing job.

* early version

![Tie Fighter Game](tie-fighter-game.gif)

* latest version

![Tie Fighter Game](tie-fighter-game-2.gif)

### Play it here: https://tie-fighter.mattsanders.org

or run it locally:

## How to start

### Install

This repo has two independent npm packages, `server/` and `webGL/`. Install
both from the repo root:

```
npm run build
```

On Windows you can also just double-click/run `install.bat`, which does the
same thing.

Create a `.env` file in `server/src/` (gitignored, not committed):

```
WEB_SERVER=3000
```

### Launch the server

From the repo root:

```
cd server/src
node main
```

The server must be started from inside `server/src` — it resolves the
`webGL/` static assets relative to its own directory.

In WebStorm you can instead just right-click `server/src/main.js` and
choose "Run".

The game will be available at `http://localhost:3000/` (or whatever port
you set `WEB_SERVER` to).

### Controls

- **Mouse** — move to steer (no need to hold a button), click to fire lasers
  (limited energy pool that recharges over time)
- **W / S** — throttle up / down
- **Q / E** — roll
- **T** — cycle target
- **G** — dock (when near a friendly ship that accepts docking)

### Testing

Run the server integration test suite from the repo root:

```
npm test
```

This spawns the real server on a scratch port and hits it over HTTP/Socket.IO
the same way a browser would (index page, client JS, CSS, a ship model, and
the Socket.IO handshake). It uses Node's built-in test runner, so no extra
install is needed.

There's also a Playwright end-to-end suite that drives the game in a real
browser (menu navigation, mission objectives, etc.):

```
npm run test:e2e
```

It boots its own server instance on a scratch port, so you don't need the
dev server running first.

## More docs

- [`server/README.md`](server/README.md) — deployment notes for the
  Node server.
- [`infra/README.md`](infra/README.md) — Terraform-managed AWS deployment
  and CI/CD.
