# Liam Hosfeld portfolio

## Run locally

Requires Node 18 or newer. Run `npm install` once to install the BigQuery client dependency.

```bash
npm install
ANALYTICS_PASSWORD='password1' npm start
```

Open:

* Portfolio: <http://localhost:4173>
* Analytics console: <http://localhost:4173/analytics> — username defaults to `liam`; password comes from `ANALYTICS_PASSWORD`
* Health check: <http://localhost:4173/api/health>

The server writes first-party events to `data/events.ndjson`. That file is ignored by Git.

## Captured events (schema v2)

The client records pseudonymous, first-party interaction events:

* `page_view` and `page_exit`, including active-reading time and engaged ratio
* Section visibility, rolled-up attention time, and dwell
* Hover and keyboard-focus duration on labeled targets
* Clicks, classified as `download`, `email`, `outbound`, `anchor`, or `action`
* Intent signals: `resume_download`, `outbound_click`, `copy` (email vs text), `print`, `text_selection`
* Friction signals: `rage_click`, `dead_click`, `js_error`
* `web_vitals`: LCP, INP, CLS, FCP, TTFB measured from real visitors
* `navigation_timing` with resource count and transferred bytes
* Image/tile impressions and normalized hot-zone regions
* Scroll-depth milestones
* Session, viewport, device-class, referrer-origin, campaign, and repeat-visit context

It deliberately does **not** collect names, email addresses, IP addresses, raw cursor coordinates, or form contents.

### Delivery and integrity

* Events retry twice with backoff, then persist to `localStorage` and are re-sent on the next page load, so a dropped network does not lose the session.
* Active time counts only visible, non-idle seconds. A tab left open overnight no longer reports a nine-hour session.
* The server deduplicates by `event_id`, rate-limits ingestion per client, and flags bot traffic so it can be excluded from every metric.
* Session duration ignores idle gaps longer than five minutes and is capped at two hours.

## Deploying

Run the same Node process behind HTTPS on the host. Set `PORT` if needed:

```bash
PORT=8080 npm start
```

Set these environment variables in production:

* `ANALYTICS_PASSWORD`: required password for `/analytics` and all analytics read/export endpoints
* `ANALYTICS_USERNAME`: optional username; defaults to `liam`
* `GCP_PROJECT_ID`, `ANALYTICS_DATASET`, and `ANALYTICS_TABLE`: BigQuery destination

The public `POST /api/events` ingestion endpoint remains available to the portfolio. The dashboard, aggregate API, raw event API, session detail, and CSV export require HTTP Basic authentication.

## Analytics console

The protected `/analytics` dashboard is organized around recruiter and hiring-manager behavior. It displays:

* Engagement, high-intent, résumé, contact, session, and scroll KPIs
* A recruiter journey funnel from visit to hiring-intent action
* Section reach and average dwell
* CTA conversion by résumé, case study, email, and LinkedIn group
* Period-over-period trends and recommendations
* Acquisition context and high-intent session review
* Core Web Vitals at p75 with good/needs-improvement/poor ratings
* Friction panel for rage clicks, dead clicks, and JavaScript errors
* Hiring-intent panel for downloads, email copies, prints, and outbound clicks
* Technical target/event and data-quality diagnostics in a collapsed secondary section

Append `?bots=include` to `/api/analytics` to see bot traffic instead of excluding it.
