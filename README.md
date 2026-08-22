# Liam Hosfeld // The Operations Dungeon

A fullscreen, dependency-free first-person portfolio game. The dungeon is one connected map: fight through military-hell sectors, authorize shield gates from portfolio terminals, unlock distinct weapons, and defeat the Operations Archon before entering the ascension gate to reach a celestial sanctuary and claim the résumé.

The game is the primary experience. Every sector exit has an in-world terminal beside a full-height shield gate. Normal sectors let the player choose whether to clear enemies or reach the terminal; boss sectors require the named boss before authorization. Each terminal presents Liam's portfolio evidence as a green command shell, then launches a different keyboard-or-mouse access game. Enemies, bosses, terminals, weapons, pickups, and keys use authored OG-Doom-like sprite art.

## Run locally

```bash
npm start
```

Then open <http://127.0.0.1:4173>. No `npm install` is required; the game uses the browser Canvas API and a small Node static server.

## Controls

* `W` / `S` — move forward/backward
* `A` / `D` — strafe left/right
* `Shift` — sprint
* Mouse — look around; left click attacks
* `1`–`6` — switch between weapons you have unlocked
* `R` — reload
* `Space` — skip the current cinematic
* `Arrow Up` / `Arrow Down` — look up/down without a mouse
* `E` or `Enter` — use a nearby terminal or interact with a door
* `Esc` — leave a terminal
* `?` — open the field manual
* `⚙` — open audio, motion, and pointer-lock settings

Inside terminals, press `Enter` to advance through the linear record. Access games use arrow keys or `WASD` to select and `Enter` to act; the memory program also uses `R` to replay its sequence. Terminal rewards unlock the Breach Shotgun, Arc Repeater, Archive Railgun, Rivet Cannon, and Electric BFG alongside the starter Arsenal Carbine.

## Direct level endpoints

The normal run starts at `/`, while these development and review URLs start directly in a chosen sector with prior terminal rewards already unlocked:

* `/level/threshold`
* `/level/trophy`
* `/level/quests`
* `/level/chronicle`
* `/level/character`
* `/level/campfire`
* `/level/gate`
* `/level/sanctuary`

Numeric aliases `/level/1` through `/level/8` follow that same order. `/api/levels` returns the available named endpoints as JSON.

## World and rendering

* The world is assembled into one continuous room-and-corridor grid.
* The camera has yaw and pitch, with raycast walls, depth-sorted low-poly meshes, procedural stone/wood materials, torches, banners, plaques, bookshelves, pedestals, crates, barrels, statues, and ambient particles.
* Ordinary enemies and bosses use low-resolution idle, movement, and attack frames. Boss sprites share the same pixel density as the rest of the enemy cast.
* Each mini-boss has a dedicated attack kit: the Contract Warden uses fan volleys, charges, and seal zones; the Legacy Colossus uses fault lines, seismic crosses, and radial stone rings; the Burnout Keeper rushes, leaves ash trails, and fires frenzy bursts.
* Terminals use a full-screen green phosphor shell with numbered screens, autocomplete, a single highlighted next action, boot/shutdown sequences, and keyboard-controlled access games.
* The skybox includes a softly glowing moon with procedural crater details.
* Combat feedback includes sprite hit reactions, weapon-specific impact effects, projectile trails, enemy auras, torch motes, footsteps, and boss phase bursts without ground markings.
* Reduced-motion settings lower particle counts, camera shake, and transition intensity.

## 3D rendering

The browser renders the scene with a small software 3D pipeline: vertical camera pitch, perspective projection, painter-sorted world geometry, raycast walls, procedural materials, sprite-only enemies, and authored camera-space weapon sprites.


## Deploy

The current standalone game deploys to Cloud Run through GitHub Actions. After pushing `main`, manually run `.github/workflows/deploy.yml`; it builds the container with Cloud Build and updates the configured Cloud Run service.
