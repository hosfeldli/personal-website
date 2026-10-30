# Lima site + Arena

This repository contains two things built from one image:

- **The Lima product and download site** (default mode) at <https://lima.liamhosfeld.com>. It serves the homepage, documentation, extension submission flow and update endpoints. It does **not** contain or serve the game.
- **Arena**, a standalone multiplayer first-person shooter at <https://game.liamhosfeld.com>, started with `SITE_MODE=arena`. It serves only the game at `/` plus its room API and WebSocket.

## Run locally

Requires Node.js 22 or newer.

    npm ci
    npm run build
    npm test
    npm start                      # Lima site on http://127.0.0.1:4173
    SITE_MODE=arena npm start      # Arena on http://127.0.0.1:4173

Run `npm run test:visual` to capture and verify the desktop/mobile lobby and all three 3D maps in isolated headless Chrome; the script prints its temporary screenshot directory.

## Arena

- Three redesigned maps: The Foundry, Skybridge, and The Citadel.
- Adjustable 90-125 degree horizontal FOV, fast air-controlled movement, double jumps, wall running and wall jumps, hold-to-bunny-hop, and jump pads.
- Two hitscan weapons, server-authoritative damage and respawns, frag/death/streak scoreboard, heal-on-frag rewards, and fully 3D armored player models. Quickplay includes two 3D training bots so solo matches are playable; hosted rooms can choose zero to three bots.
- Public server browser with hosted room creation, 2-10 player slots, and shareable room URLs. Quickplay is always available.

**Controls:** WASD to move, mouse to aim, left click to fire, Space to jump/double jump, hold Space to bunny-hop, 1/2 or Q to switch weapons, and Esc to pause. Move along a wall while airborne to wall run; jump again to kick off it.

Rooms and scores are **in memory**, not durable. Empty hosted rooms expire after 10 minutes. A deployment or restart clears them.

## Deployment

The existing manually triggered GitHub Actions workflow (Actions, "Build and deploy Stem portfolio") runs the build and tests, then submits Cloud Build, which deploys the image to two Cloud Run services in `us-east1`:

| Service | Domain | Mode | Scaling |
| --- | --- | --- | --- |
| `stem-portfolio-host` | lima.liamhosfeld.com | Lima site | 0-3 instances |
| `arena-game` | game.liamhosfeld.com | `SITE_MODE=arena` | exactly 1 instance (in-memory rooms, WebSockets, 1 hour request timeout) |

The always-warm Arena instance has a small continuous hosting cost.

## Lima updates

/updates/latest.json reads the latest GitHub release and returns the current version, DMG URL, update package URL, release page, and publication date. /downloads/Lima.dmg redirects to the release DMG.

Set LIMA_RELEASE_REPOSITORY to point the site at a different release repository. The app can use https://<site-host>/updates/latest.json as its update metadata source after deployment.
