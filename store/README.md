# Lima Extension Store

`extensions.json` is the publish manifest consumed by the Lima app. Each item
must point to a ZIP in `packages/`, with the SHA-256 and exact byte size of that
ZIP. A package extracts to exactly one extension folder containing
`manifest.json`; symbolic links are rejected by Lima.

To publish an extension:

1. Add the canonical source manifest to `store/manifests/<extension-id>.json`.
   The manifest's public `id`, `name`, and `version` must match the catalog.
2. Create a deterministic ZIP whose root folder is the full extension ID and
   whose direct child is `manifest.json`. Published package filenames are short
   kebab-case names such as `app-management.zip`; they do not need to match the
   full extension ID.
3. Place the ZIP in `store/packages/` and add a catalog entry with `id`, `name`,
   `version`, `summary`, `author`, `icon`, `category`, `downloadURL`, `sha256`,
   and exact byte `size`.
4. Run `npm run validate-store` and `npm run build`, deploy the site, and use
   Lima's Extension Store to verify installation from the live catalog.

Packages are executable local code once installed. Publish only reviewed
extensions and increment the manifest version for every package update.
