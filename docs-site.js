'use strict';
const menu = document.querySelector('.mobile-menu-button');
const nav = document.querySelector('#global-nav');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  nav?.classList.toggle('open', !open);
});

const guides = {
  '/docs': {
    title: 'Lima documentation',
    lede: 'Get up and running, learn the launcher, and shape Lima around your work.',
    body: '<h2>Start here</h2><ul><li><a href="/docs/getting-started/install">Install Lima</a> and grant the permissions it needs.</li><li><a href="/docs/features/launcher">Use the launcher</a> to find apps, files, commands, and extensions.</li><li><a href="/docs/extensions">Explore extensions</a> when the built-in commands are not enough.</li></ul>'
  },
  '/docs/getting-started/install': {
    title: 'Install Lima',
    lede: 'Download the DMG, move Lima to Applications, then open it from there.',
    body: '<h2>Install</h2><ol><li>Download the latest Lima disk image.</li><li>Open it and drag Lima to your Applications folder.</li><li>Launch Lima and use the launcher shortcut to begin.</li></ol><p><a href="/downloads/Lima.dmg">Download Lima →</a></p>'
  },
  '/docs/getting-started/permissions': {
    title: 'Permissions',
    lede: 'Lima asks only for the macOS access required by the features you enable.',
    body: '<h2>When Lima needs access</h2><p>macOS may request Accessibility permission for window controls or other system-integrated commands. Review permissions in System Settings whenever you enable a feature that needs them.</p>'
  },
  '/docs/features/launcher': {
    title: 'Use the launcher',
    lede: 'Open Lima, type what you need, use the arrow keys to choose a result, and press Return to run it.',
    body: '<h2>Find an action</h2><p>Search brings apps, files, commands, and installed extensions into one place. Keep the query short; Lima narrows results as you type.</p><h2>Run it</h2><p>Use ↑ and ↓ to select a result, then press Return. Commands with shortcuts show them alongside the result.</p>'
  },
  '/docs/features/writing': {
    title: 'Fix Writing',
    lede: 'Correct selected text without leaving the app you are using.',
    body: '<h2>How it works</h2><p>Select text in a supported app, then run Fix Writing from Lima. Use your configured AI provider, or choose Harper for local grammar checks when it is available.</p>'
  },
  '/docs/features/dictation': {
    title: 'Dictation',
    lede: 'Start a focused dictation session and keep working while Lima records your note.',
    body: '<h2>Capture a note</h2><p>Run Dictate Note from the launcher. Lima keeps the recording controls close at hand so you can capture an idea without changing your wider workflow.</p>'
  },
  '/docs/features/notes': {
    title: 'Notes',
    lede: 'Use Quick Note for a short capture or direct a note to the workspace you are already using.',
    body: '<h2>Keep context</h2><p>Notes are designed for quick captures. Open Lima, run Quick Note, write or dictate the thought, and return to what you were doing.</p>'
  },
  '/docs/extensions': {
    title: 'Extensions',
    lede: 'Add focused commands for the work you do most.',
    body: '<h2>Choose an extension</h2><p>Browse reviewed packages, inspect what they do, then install only the tools you want in your launcher.</p><p><a href="/extensions">Browse extensions →</a></p>'
  },
  '/docs/extensions/install': {
    title: 'Install an extension',
    lede: 'Install a reviewed package, then reload Lima to make its commands available.',
    body: '<h2>Install safely</h2><p>Use packages from the extension directory or inspect a package before you add it. Lima keeps extension capabilities explicit so you can make an informed choice.</p>'
  },
  '/docs/extensions/configure': {
    title: 'Configure extensions',
    lede: 'Enable commands, assign shortcuts, and review what each extension can access.',
    body: '<h2>Keep commands focused</h2><p>Use Lima’s settings to decide which extension commands are enabled and which shortcuts belong in your regular flow.</p>'
  },
  '/docs/extensions/build': {
    title: 'Build an extension',
    lede: 'Start with one clear command, a manifest, and explicit capabilities.',
    body: '<h2>Build small</h2><p>An extension should do one useful thing well. Define its command in the manifest, describe the capability it needs, and keep the interaction predictable.</p><p><a href="/docs/EXTENSIONS.md">Read the extension guide →</a></p>'
  },
  '/docs/extensions/forms': {
    title: 'Extension forms',
    lede: 'Use a small form when a command needs a focused, explicit input.',
    body: '<h2>Ask only for what is needed</h2><p>Keep forms short and make each field clear. A command should return the user to their work as soon as the input is complete.</p>'
  },
  '/docs/extensions/actions': {
    title: 'Extension actions',
    lede: 'Actions let an extension return a clear next step instead of a dead end.',
    body: '<h2>Make outcomes useful</h2><p>Use actions for the small set of follow-up choices that belong with a result. Keep names specific so users know what will happen before they run one.</p>'
  },
  '/docs/extensions/manifest': {
    title: 'Extension manifest',
    lede: 'The manifest defines an extension’s identity, commands, actions, and capabilities.',
    body: '<h2>Reference</h2><p>Use the manifest reference when you need the complete schema and examples for a Lima extension.</p><p><a href="/docs/extension-manifest.schema.json">Open the manifest schema →</a></p>'
  },
  '/docs/reference/shortcuts': {
    title: 'Keyboard shortcuts',
    lede: 'Shortcuts make Lima faster when an action becomes part of your everyday workflow.',
    body: '<h2>Set a shortcut</h2><p>Choose shortcuts that are memorable and do not conflict with the apps you use. You can run any command from the launcher even when it does not have a shortcut.</p>'
  },
  '/docs/reference/privacy': {
    title: 'Privacy and security',
    lede: 'Lima keeps local work local where possible and makes external integrations explicit.',
    body: '<h2>Review before you connect</h2><p>Review a feature’s settings before you add credentials or allow a capability. Use local options such as Harper when they fit your workflow.</p>'
  },
  '/docs/troubleshooting': {
    title: 'Troubleshooting',
    lede: 'Start with the command, the permission, and the configured integration.',
    body: '<h2>Common checks</h2><ul><li>Confirm Lima is running and the launcher shortcut is available.</li><li>Check required macOS permissions for system-integrated commands.</li><li>Review the relevant settings when a connected service or extension is unavailable.</li></ul>'
  }
};

const path = location.pathname.replace(/\/$/, '') || '/docs';
const aliases = {
  '/docs/getting-started': '/docs/getting-started/install',
  '/docs/reference/environment': '/docs/reference/privacy'
};
const page = guides[aliases[path] || path] || guides['/docs'];
document.title = page.title + ' — Lima';
const article = document.querySelector('#docs-article');
article.innerHTML = '<p class="docs-kicker">Documentation</p><h1>' + page.title + '</h1><p class="docs-lede">' + page.lede + '</p><div class="docs-body">' + page.body + '</div>';

document.querySelectorAll('.docs-sidebar a').forEach((link) => {
  if (link.getAttribute('href') === path) link.classList.add('active');
});

const input = document.querySelector('#docs-search');
const results = document.querySelector('#docs-results');
const searchPages = Object.entries(guides).map(([url, value]) => ({ url, title: value.title, lede: value.lede }));
input?.addEventListener('input', () => {
  const query = input.value.trim().toLowerCase();
  if (!query) { results.innerHTML = ''; return; }
  const matches = searchPages.filter((item) => (item.title + ' ' + item.lede).toLowerCase().includes(query));
  results.innerHTML = matches.length
    ? matches.map((item) => '<a href="' + item.url + '"><b>' + item.title + '</b><span>' + item.lede + '</span></a>').join('')
    : '<p class="docs-empty">No matching documentation.</p>';
});
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    input?.focus();
  }
});