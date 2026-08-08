# Liam Hosfeld // The Operations Dungeon

A fullscreen, dependency-free first-person portfolio game. The dungeon is one connected map: walk through the chambers, recover Liam's field records, unlock spells, switch between distinct weapons, and defeat the Operations Archon before entering the ascension gate to reach a celestial sanctuary and claim the résumé.

The landing page is résumé-first. The interactive dungeon is an optional way to explore the same experience, impact, focus areas, and capabilities.

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
* `1` / `2` / `3` — switch between weapons you have received
* Walk to a path weapon display and press `E` to equip it; `1` / `2` / `3` also switch weapons
* `Z` / `X` — select the previous/next learned spell
* `Q` — cast the selected spell
* `Arrow Up` / `Arrow Down` — look up/down without a mouse
* `E` or `Enter` — equip a nearby lobby weapon, read a record, or interact with the gate
* `Esc` — return to the résumé menu
* `?` — open the field manual
* `⚙` — open audio, motion, and pointer-lock settings

Records grant XP and unlock spells automatically. Z and X select the previous or next learned spell, and Q casts the selected spell. Ninja stars are fast ranged throws, the crossbow is a deliberate precision projectile with recovery, and the Ember Wand fires splash-damage projectiles colored by the active spell.

## World and rendering

* The world is assembled into one continuous room-and-corridor grid.
* The camera has yaw and pitch, with raycast walls, depth-sorted low-poly meshes, procedural stone/wood materials, torches, banners, plaques, bookshelves, pedestals, crates, barrels, statues, and ambient particles.
* The skybox includes a softly glowing moon with procedural crater details.
* Combat feedback includes hit markers, damage numbers, weapon-specific impact effects, spell rings, projectile trails, enemy auras, torch motes, footsteps, and boss phase bursts.
* Reduced-motion settings lower particle counts, camera shake, and transition intensity.

## 3D rendering

The browser renders the scene with a small software 3D pipeline: vertical camera pitch, perspective projection, painter-sorted low-poly meshes, raycast walls, procedural materials, and hand-built camera-space weapon meshes.


## Deploy

The current standalone game deploys to Cloud Run through GitHub Actions. Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds the container with Cloud Build and updates the configured Cloud Run service.
