# Lima Extension Store

`extensions.json` is the publish manifest consumed by the Lima app. Each item
must point to a ZIP in `packages/`, with the SHA-256 and exact byte size of that
ZIP. A package extracts to exactly one extension folder containing
`manifest.json`; symbolic links are rejected by Lima.

To publish an extension:

1. Make a directory whose `manifest.json` has the public extension id, name,
   and version.
2. ZIP that single directory into `store/packages/<id>.zip`.
3. Add a catalog entry with `id`, `name`, `version`, `summary`, `author`,
   `icon`, `category`, `downloadURL`, `sha256`, and `size`.
4. Run `npm run build`, deploy this site, and use Lima's Extension Store to
   verify installation from the live catalog.

Packages are executable local code once installed. Publish only reviewed
extensions and increment the manifest version for every package update.
