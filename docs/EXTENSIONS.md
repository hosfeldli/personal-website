# Build Lima extensions

Lima extensions add focused commands and compact macOS workflows to the launcher. A command should be easy to find, safe to run, and clear about its outcome.

This guide documents the public manifest contract for **schema version 3**. The authoritative validation source is [extension-manifest.schema.json](/docs/extension-manifest.schema.json); do not invent fields, action types, or operations that are not documented there.

## What an extension contains

An installed extension is a folder with a UTF-8 `manifest.json` file. It can also include local executables and assets when the command genuinely needs them.

```text
my-extension/
├── manifest.json
├── bin/
│   └── optional-reviewed-executable
└── assets/
    └── optional-local-data
```

Install the folder in:

```text
~/Library/Application Support/Lima/Extensions/
```

Then use **Reload Extensions** in Lima. Each command has its own enable switch and can have a user-configured shortcut in **Settings → Extensions**.

## Choose the smallest interaction

Before writing a manifest, choose the simplest host feature that fits.

| Need | Prefer |
| --- | --- |
| Open a URL, file, or app | A direct `url`, `file`, or `application` action |
| Move or resize the focused window | A `window` action |
| Copy, paste, or choose a reusable host tool | A `clipboard` or `picker` action |
| Ask for a small amount of input | A `form` action |
| Run deterministic local logic | A direct `shell` action or a form that runs one executable |
| Perform two to eight safe native steps | A bounded `chain` |
| Sustained host-owned functionality | A documented `workspace` or `generator` operation only |

Use inline presentation by default. Use a workspace only when the interaction genuinely needs a separate persistent surface. Do not create daemons, login items, hidden watchers, or background services.

## A complete starter manifest

This is a small file-opening extension. It demonstrates metadata, search terms, a stable command ID, and minimal capability use.

```json
{
  "schemaVersion": 3,
  "id": "local.example.project-tools",
  "name": "Project Tools",
  "version": "1.0.0",
  "description": "Shortcuts for a local project workflow.",
  "category": "Developer Tools",
  "capabilities": ["filesystem"],
  "presentation": "inline",
  "commands": [
    {
      "id": "open-projects",
      "title": "Open Projects",
      "subtitle": "Open the local Projects folder",
      "keywords": ["code", "folder", "work"],
      "aliases": ["projects"],
      "icon": "folder.fill",
      "action": {
        "type": "file",
        "value": "~/Projects"
      }
    }
  ]
}
```

## Manifest reference

Every manifest must include:

| Field | Type | Notes |
| --- | --- | --- |
| `schemaVersion` | integer | Supported values are `1`, `2`, and `3`. New extensions should use `3`. |
| `id` | string | Stable extension identity. It may contain letters, numbers, periods, underscores, and hyphens. |
| `name` | string | Human-readable extension name. |
| `commands` | array | At least one command. |

Optional manifest fields are `version`, `description`, `pack`, `category`, `bundled`, `provenance`, `trust`, `capabilities`, and `presentation`.

Use reverse-domain-style IDs such as `local.example.project-tools`. Extension IDs, command IDs, and form field IDs are persistence keys: changing one can reset saved enablement, shortcut, or remembered-form state.

### Distribution metadata

`bundled`, `provenance`, and `trust` describe how Lima obtained an extension.

* `provenance` can be `bundled`, `userInstalled`, or `unsigned`.
* `trust` can be `bundled`, `builtIn`, `userInstalled`, or `unsigned`.
* User-authored extensions must not claim bundled provenance or trust.

### Capabilities

Request only the capabilities needed by the manifest. User extensions are reviewed and approved based on their declared authority.

| Capability | Use it for |
| --- | --- |
| `filesystem` | Opening or selecting local files and directories |
| `clipboard` | Clipboard actions |
| `selectedText` | Selected-text invocation workflows |
| `accessibility` | Focus restoration, insertion, and window actions |
| `processControl` | Application operations and application pickers |
| `systemControl` | Lock, sleep, logout, restart, or shutdown operations |
| `shell` | Direct executable invocation |
| `externalExecution` | An executable outside the extension directory |
| `network` | A URL-opening command that genuinely needs network access |
| `contextShelf` | Reading or accepting Context Shelf context |

An extension runs with the signed-in user's permissions. Install only code you trust, avoid broad capabilities, and make destructive behavior visible in the command subtitle and confirmation flow.

## Command reference

Every command requires `id`, `title`, and `action`.

| Field | Purpose |
| --- | --- |
| `id` | Stable command identity within the extension |
| `title` | The user-facing search result |
| `subtitle` | A brief, outcome-focused explanation |
| `keywords` | Search synonyms |
| `aliases` | Exact alternate command names |
| `icon` | A host-recognized icon name |
| `hotkey` | Optional default shortcut |
| `presentation` | `inline`, `workspace`, or `background`; overrides the manifest default |
| `runInBackground` | Legacy compatibility flag; use `presentation: "background"` for new v3 commands |
| `surface` | Declares the host surface for interactive commands |
| `invocation` | Declares direct arguments and allowed host context |
| `output` | Declares the result type and shared output actions |
| `action` | The native action to run |

A title should describe the result, not the implementation. Put alternative words in `keywords` or `aliases`. For example:

```json
{
  "id": "move-left",
  "title": "Move Window Left",
  "subtitle": "Place the focused window in the left half",
  "keywords": ["tile", "snap", "arrange"],
  "aliases": ["left", "tile-left"],
  "icon": "rectangle.lefthalf.inset.filled",
  "action": {
    "type": "window",
    "operation": "leftHalf"
  }
}
```

### Shortcuts

Use modifier names such as `command`, `option`, `control`, and `shift` followed by a supported key.

```json
{
  "hotkey": "command+shift+f"
}
```

`command+command` is the double-Command gesture. Default shortcuts should be rare because users can independently enable, disable, and record them.

## Action reference

An action has a required `type` and can use these shared fields when applicable:

| Field | Meaning |
| --- | --- |
| `value` | Primary string value, such as a path, URL, or executable |
| `operation` | The host operation for a typed action |
| `target` | A host-defined target such as `picker` |
| `confirmation` | Requests host-managed confirmation for destructive work |
| `parameters` | String-to-string values for supported host actions |
| `arguments` | Separate executable arguments |
| `workingDirectory` | Directory for direct executable work |
| `form` | Native input and execution definition |
| `chain` | Up to eight approved native actions |

The schema accepts these action types: `application`, `clipboard`, `file`, `form`, `picker`, `shell`, `system`, `url`, `window`, `workspace`, and `generator`.

### URL and file actions

Use `url` for a valid `http` or `https` URL and `file` for a local path. A relative file path is resolved from the extension directory.

```json
{
  "id": "open-handbook",
  "title": "Open Team Handbook",
  "subtitle": "Open the local handbook PDF",
  "action": {
    "type": "file",
    "value": "assets/handbook.pdf"
  }
}
```

```json
{
  "id": "open-status",
  "title": "Open Status Page",
  "subtitle": "Open the service status page",
  "action": {
    "type": "url",
    "value": "https://status.example.com"
  }
}
```

### Application actions

Application operations are `quit`, `forceQuit`, `restart`, `activate`, `hide`, `unhide`, `quitAll`, and `forceQuitAll`. Use `target: "picker"` when the user should choose the app.

```json
{
  "id": "quit-app",
  "title": "Quit Application",
  "subtitle": "Choose a running app to quit",
  "action": {
    "type": "application",
    "operation": "quit",
    "target": "picker"
  }
}
```

Force quit is destructive, so explicitly ask the host to confirm it.

```json
{
  "type": "application",
  "operation": "forceQuit",
  "target": "picker",
  "confirmation": true
}
```

### Clipboard and picker actions

Clipboard operations are `copy`, `paste`, and `pastePlainText`. Picker operations are `emoji`, `application`, `file`, `timezone`, and `password`.

```json
{
  "id": "emoji",
  "title": "Open Emoji Picker",
  "subtitle": "Search and paste Unicode emoji",
  "action": {
    "type": "picker",
    "operation": "emoji",
    "parameters": { "query": "fire" }
  }
}
```

The host owns focus restoration and cancellation. Escape must leave the target app and clipboard unchanged.

### Window and system actions

Window operations include `leftHalf`, `rightHalf`, `topHalf`, `bottomHalf`, `maximize`, `center`, `leftThird`, `centerThird`, `rightThird`, `leftTwoThirds`, `rightTwoThirds`, `topLeftQuarter`, `topRightQuarter`, `bottomLeftQuarter`, `bottomRightQuarter`, `restorePrevious`, `nextDisplay`, `previousDisplay`, and `mainDisplay`.

```json
{
  "id": "center-window",
  "title": "Center Window",
  "subtitle": "Center the focused window",
  "action": {
    "type": "window",
    "operation": "center"
  }
}
```

System operations are `lock`, `sleep`, `screenSaver`, `logout`, `restart`, and `shutdown`. Destructive system actions should always request confirmation.

```json
{
  "id": "lock-screen",
  "title": "Lock Screen",
  "subtitle": "Lock this Mac",
  "action": {
    "type": "system",
    "operation": "lock"
  }
}
```

### Workspace and generator actions

`workspace` and `generator` are host-owned extension points. Use them only for operations that Lima explicitly documents and implements. They are **not** a generic way to open an arbitrary custom window, execute a network request, or define a new rendering protocol.

For user-authored work that needs input or deterministic local output, use `form` plus one reviewed executable instead. Do not assume undocumented `workspace` or `generator` operations exist.

## Forms

Use a form only when a command needs user input. A form requires `fields` and `execution`; `title` and `submitLabel` are optional.

Schema v3 supports these field types:

| Field type | Appropriate input |
| --- | --- |
| `text` | A short non-secret string |
| `secure` | A secret used for the current run |
| `multiline` | A longer text body |
| `number` | A numeric value |
| `toggle` | A true/false choice |
| `picker` | One option from `options` |
| `file` | A file path |
| `directory` | A folder path |
| `date` | A date |
| `slider` | A bounded numeric value |
| `keyValue` | A compact key/value collection |

All form fields require `id`, `label`, and `type`. Optional field properties are `placeholder`, `defaultValue`, `options`, `required`, `section`, `helpText`, `minimum`, `maximum`, and `visibleWhen`.

`visibleWhen` requires `field` plus exactly one of `equals` or `notEquals`. Required validation applies only while the field is visible.

### Example: a conditional form

```json
{
  "id": "count-lines",
  "title": "Count Lines",
  "subtitle": "Count lines in a selected file",
  "keywords": ["lines", "file", "text", "count"],
  "icon": "text.alignleft",
  "surface": {
    "kind": "form",
    "preferredHeight": 320,
    "remembersState": true,
    "canPopOut": false,
    "timeoutPolicy": "global"
  },
  "action": {
    "type": "form",
    "value": "",
    "form": {
      "title": "Count Lines",
      "submitLabel": "Count",
      "fields": [
        {
          "id": "inputFile",
          "label": "File",
          "type": "file",
          "required": true,
          "section": "Input"
        },
        {
          "id": "includeBlank",
          "label": "Include blank lines",
          "type": "toggle",
          "defaultValue": "false",
          "section": "Options"
        },
        {
          "id": "prefix",
          "label": "Output prefix",
          "type": "text",
          "placeholder": "Optional",
          "visibleWhen": {
            "field": "includeBlank",
            "equals": "true"
          }
        }
      ],
      "execution": {
        "type": "shell",
        "executable": "/usr/bin/wc",
        "arguments": ["-l", "{{inputFile}}"],
        "timeoutSeconds": 20
      }
    }
  }
}
```

The only schema-v3 form execution type is `shell`. Pass each value as a separate argument element. Template placeholders use `{{fieldID}}`.

Never use `eval`, `zsh -c`, `bash -c`, or a string-built command. Invoke an executable directly, use explicit paths because GUI apps have a minimal `PATH`, treat every field value as untrusted, and keep stdout/stderr below Lima's 1 MB captured-output limit.

### Direct executable action

For fixed input, a direct `shell` action is smaller than a form. The executable may be extension-relative.

```json
{
  "schemaVersion": 3,
  "id": "local.example.title-tools",
  "name": "Title Tools",
  "capabilities": ["shell"],
  "commands": [
    {
      "id": "normalize-title",
      "title": "Normalize Title",
      "subtitle": "Run the bundled title normalizer",
      "action": {
        "type": "shell",
        "value": "bin/normalize-title",
        "arguments": ["--style", "sentence"],
        "workingDirectory": "."
      }
    }
  ]
}
```

Request `externalExecution` only when the executable really lives outside the extension directory.

## Invocation, context, and output

### Invocation

`invocation` lets a command accept direct arguments from launcher search.

| Field | Use |
| --- | --- |
| `acceptsRemainder` | Allow remaining query text |
| `arguments` | Typed arguments |
| `context` | Allowed host-provided context |

Argument kinds are `text`, `integer`, `number`, `application`, `file`, `directory`, and `choice`. An argument has `id` and `kind`; it can also use `required`, `options`, `minimum`, `maximum`, and `consumeRemainder`.

```json
{
  "invocation": {
    "acceptsRemainder": true,
    "arguments": [
      {
        "id": "style",
        "kind": "choice",
        "options": ["compact", "pretty"],
        "required": false
      },
      {
        "id": "count",
        "kind": "integer",
        "minimum": 1,
        "maximum": 20
      }
    ],
    "context": ["selectedText", "contextShelfText"]
  }
}
```

Available context values are `selectedText`, `clipboardText`, `file`, and `contextShelfText`. Context belongs only to the active invocation; do not automatically store it in settings, analytics, logs, or a file.

### Surface

Use `surface` for an interactive command:

| Field | Values |
| --- | --- |
| `kind` | `form`, `generator`, `picker`, `textTool`, or `liveOutput` |
| `preferredHeight` | 120 through 700 |
| `remembersState` | Boolean |
| `canPopOut` | Boolean |
| `timeoutPolicy` | `global` or `never` |

`inline` is the default presentation. `workspace` is for sustained interaction. `background` runs without a persistent interactive surface. `timeoutPolicy: "never"` is reserved for persistent tools; extensions cannot choose arbitrary timeouts.

### Output

`output` describes a command result so Lima can offer shared actions without every extension rebuilding them.

| `kind` | Typical result |
| --- | --- |
| `text` | Plain text |
| `markdown` | Rich text |
| `json` | JSON data |
| `file` | A generated or selected file |
| `status` | A concise status result |

Set `copyable`, `pasteable`, `shelfEligible`, and `notesEligible` only when they make sense for the output.

```json
{
  "output": {
    "kind": "markdown",
    "copyable": true,
    "pasteable": true,
    "shelfEligible": true,
    "notesEligible": true
  }
}
```

Lima provides the shared Copy, Paste, Add to Shelf, and Send to Note actions. Extensions should declare usable output instead of duplicating those controls.

## Bounded action chains

Use `chain` for a short sequence of independently safe native actions. A chain is limited to eight actions and cannot contain `shell`, `form`, `url`, or `file` actions. It is not an arbitrary workflow language.

```json
{
  "id": "prepare-window",
  "title": "Prepare Window",
  "subtitle": "Arrange the focused window for work",
  "action": {
    "type": "window",
    "operation": "center",
    "chain": [
      { "type": "window", "operation": "maximize" },
      { "type": "window", "operation": "mainDisplay" }
    ]
  }
}
```

Use a chain only when each step is explicit, predictable, and safe to cancel. For anything involving variable input or executable logic, use a form instead.

## Full v3 example

This combines aliases, typed invocation, host context, a form surface, output metadata, and a safe shell execution pattern.

```json
{
  "schemaVersion": 3,
  "id": "local.example.text-tools",
  "name": "Text Tools",
  "version": "1.0.0",
  "description": "Focused local text commands.",
  "category": "Developer Tools",
  "capabilities": ["shell", "selectedText", "contextShelf"],
  "presentation": "inline",
  "commands": [
    {
      "id": "format",
      "title": "Format Text",
      "subtitle": "Choose an output style",
      "keywords": ["format", "text"],
      "aliases": ["fmt"],
      "icon": "textformat",
      "hotkey": "command+shift+f",
      "invocation": {
        "acceptsRemainder": true,
        "arguments": [
          {
            "id": "style",
            "kind": "choice",
            "options": ["compact", "pretty"]
          }
        ],
        "context": ["selectedText", "contextShelfText"]
      },
      "surface": {
        "kind": "form",
        "preferredHeight": 320,
        "remembersState": true,
        "canPopOut": true,
        "timeoutPolicy": "global"
      },
      "output": {
        "kind": "markdown",
        "copyable": true,
        "pasteable": true,
        "shelfEligible": true,
        "notesEligible": true
      },
      "action": {
        "type": "form",
        "value": "",
        "form": {
          "title": "Format Text",
          "submitLabel": "Format",
          "fields": [
            {
              "id": "style",
              "label": "Style",
              "type": "picker",
              "options": ["compact", "pretty"],
              "required": true,
              "section": "Format",
              "helpText": "Choose an output style."
            }
          ],
          "execution": {
            "type": "shell",
            "executable": "/usr/bin/printf",
            "arguments": ["%s", "{{style}}"],
            "timeoutSeconds": 20
          }
        }
      }
    }
  ]
}
```

## Test and package

Before sharing an extension:

1. Validate `manifest.json` against [extension-manifest.schema.json](/docs/extension-manifest.schema.json).
2. Compare with the [copy-ready starter manifest](/docs/starter-extension/manifest.json) and the [complete v3 fixture](/docs/extension-v3-fixture.json).
3. Reload the extension in Lima, then search by title, alias, and important keyword.
4. Test keyboard-only navigation, Escape, required-field validation, success feedback, failure feedback, and each configured shortcut.
5. Verify every capability is necessary and every destructive operation requests confirmation.
6. Confirm secrets, selected text, clipboard data, and dictated text are not logged or persisted.
7. Test the installed extension in Lima—not only the executable in Terminal.
8. Package the extension root so `manifest.json` is at the ZIP root; avoid nested archives, hidden files, executable payloads that have not been reviewed, and path traversal.

For an AI-focused review and handoff checklist, also read [EXTENSION_AUTHORING_FOR_AI.md](/docs/EXTENSION_AUTHORING_FOR_AI.md).