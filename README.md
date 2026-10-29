# Lima site + Arena

The public Lima product and download site now includes **Arena**, a fast multiplayer first-person shooter at /arena. The Lima homepage, documentation, extension submission flow, and update endpoints remain intact.

## Run locally

Requires Node.js 22 or newer.

    npm ci
    npm run build
    npm test
    npm start

Open <http://127.0.0.1:4173/arena> in two browser windows to play together.

## Arena

- Three redesigned maps: The Foundry, Skybridge, and The Citadel.
- Adjustable 90–125° horizontal FOV, fast air-controlled movement, double jumps, wall running and wall jumps, hold-to-bunny-hop, and jump pads.
- Two hitscan weapons, server-authoritative damage and respawns, frag/death scoreboard, and fully 3D armored player models. There are no enemy sprites or PvE enemies in the new Arena. Legacy game and sprite files are excluded from the deployment image.
- Public server browser with hosted room creation, 2–10 player slots, and shareable room URLs. Quickplay is always available.

**Controls:** WASD to move, mouse to aim, left click to fire, Space to jump/double jump, hold Space to bunny-hop, 1/2 or Q to switch weapons, and Esc to pause. Move along a wall while airborne to wall run; jump again to kick off it.

Rooms and scores are **in memory**, not durable. Empty hosted rooms expire after 10 minutes. A deployment or process restart clears them. The server caps hosted rooms and active players for the single-instance Cloud Run configuration.

## Deployment

The existing GitHub Actions → Cloud Build → Cloud Run pipeline now runs build and tests, then deploys on pushes to main or manual workflow dispatch. The container reruns the build checks before it can be published; the workflow runs the full tests before submitting Cloud Build. Cloud Run is configured with one warm instance, maximum one instance, concurrency 80, and a one-hour request timeout so WebSocket players in a match share the same process. The always-warm instance changes hosting cost; review that configuration before rollout. No remote deployment happens just by editing this checkout.

## Lima updates

/updates/latest.json reads the latest GitHub release and returns the current version, DMG URL, update package URL, release page, and publication date. /downloads/Lima.dmg redirects to the release DMG.

Set LIMA_RELEASE_REPOSITORY to point the site at a different release repository. The app can use https://<site-host>/updates/latest.json as its update metadata source after deployment.
