# LiamFlow site

The public product and download site for LiamFlow, Liam Hosfeld's private macOS workbench.

## Run locally

```bash
npm start
```

Open <http://127.0.0.1:4173>. The site has no front-end dependencies.

## Download and update source

`/updates/latest.json` reads the latest GitHub release and returns the current version, DMG URL, update package URL, release page, and publication date. `/downloads/LiamFlow.dmg` redirects to the release DMG.

Set `LIAMFLOW_RELEASE_REPOSITORY` to point the site at a different release repository. The app can use `https://<site-host>/updates/latest.json` as its update metadata source after deployment.

## Deployment

The existing GitHub workflow deploys this Node service to Cloud Run. The server serves only the product page, supporting assets, download redirect, and update metadata endpoints; archived portfolio game files are intentionally not publicly routed.
