# Liam Hosfeld portfolio

## Run locally

Requires Node 18 or newer. No npm dependencies are required.

```bash
npm start
```

Open:

* Portfolio: <http://localhost:4173>
* Analytics console: <http://localhost:4173/analytics>
* Health check: <http://localhost:4173/api/health>

The server writes first-party events to `data/events.ndjson`. That file is ignored by Git.

## Captured events

The client records pseudonymous, first-party interaction events:

* `page_view` and `page_exit`
* Section visibility, scroll-position attention, and dwell time
* Hover start/end and hover duration
* Keyboard focus start/end and focus duration
* Clicks on labeled targets
* Image/tile impressions and normalized hot-zone regions
* Scroll-depth milestones
* Session, viewport, device-class, referrer-origin, and campaign context

It deliberately does **not** collect names, email addresses, IP addresses, raw cursor coordinates, or form contents.

## Deploying

Run the same Node process behind HTTPS on the host. Set `PORT` if needed:

```bash
PORT=8080 npm start
```

For a hosted analytics store, set `window.PORTFOLIO_ANALYTICS_ENDPOINT` before `analytics.js` loads and point it to a same-origin or CORS-enabled collector that accepts the same `{ "events": [] }` payload.

## Analytics console

The `/analytics` route embeds a non-tracking copy of the portfolio and overlays collected activity on the real page geometry. It displays:

* Section attention heat from view, milestone, dwell, and heartbeat events
* Target heat from impressions, hovers, focus, clicks, and dwell
* Scroll-position heat bands
* Action suggestions based on observed behavior
* Basic navigation context without IP collection
