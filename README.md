# Liam Hosfeld // The Operations Dungeon

A fullscreen, dependency-free first-person portfolio game. The dungeon is one connected map: walk through seven chambers, recover Liam's field records, unlock spells, switch between distinct weapons, and defeat the Operations Archon before returning through the door of light.

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
* First-room Wayfarer — press `E`, then use `W` / `A` / `S` to receive a weapon or `D` to cycle
* `Z` / `X` — select the previous/next learned spell
* `Q` — cast the selected spell
* `Arrow Up` / `Arrow Down` — look up/down without a mouse
* `E` or `Enter` — talk to the Wayfarer, read a nearby record, or enter the door of light
* `Esc` — return to the résumé menu
* `?` — open the field manual
* `⚙` — open audio, motion, and pointer-lock settings

Records grant XP and unlock spells automatically. The spell strip in the HUD also supports direct mouse selection after spells are learned. The spear is a close-range thrust with knockback, the crossbow is a deliberate precision projectile with recovery, and the Ember Wand fires splash-damage projectiles colored by the active spell.

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
