'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { execFile } = require('node:child_process');
const { Buffer } = require('node:buffer');
const { promisify } = require('node:util');
const { inspectExtensionArchive, SubmissionValidationError } = require('../lib/extension-submissions');
const run = promisify(execFile);

const validManifest = {
  schemaVersion: 2,
  id: 'community.example',
  name: 'Example Extension',
  version: '1.0.0',
  commands: [{ id: 'open', title: 'Open Lima', action: { type: 'url', value: 'https://www.liamhosfeld.com' } }],
  capabilities: ['network'],
};

async function makeZip(entries, root = 'community.example') {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'lima-test-'));
  const source = path.join(directory, root);
  const archive = path.join(directory, 'extension.zip');
  await fs.mkdir(source, { recursive: true });
  for (const [relative, content] of Object.entries(entries)) {
    const target = path.join(source, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, typeof content === 'string' ? content : JSON.stringify(content));
  }
  const payload = Buffer.from(JSON.stringify(entries)).toString('base64');
  const python = `import base64,json,sys,zipfile; entries=json.loads(base64.b64decode(sys.argv[3])); z=zipfile.ZipFile(sys.argv[2],'w',zipfile.ZIP_DEFLATED); [z.writestr(sys.argv[4]+'/'+name, value if isinstance(value,str) else json.dumps(value)) for name,value in entries.items()]; z.close()`;
  await run('/usr/bin/python3', ['-c', python, directory, archive, payload, root]);
  return { directory, archive };
}

async function expectInvalid(archive, phrase) {
  await assert.rejects(() => inspectExtensionArchive(archive), (error) => {
    assert(error instanceof SubmissionValidationError);
    assert.match(error.message, new RegExp(phrase, 'i'));
    return true;
  });
}

test('accepts a valid extension package and computes a digest', async () => {
  const fixture = await makeZip({ 'manifest.json': validManifest });
  const result = await inspectExtensionArchive(fixture.archive);
  assert.equal(result.manifest.id, validManifest.id);
  assert.equal(result.entries.length, 1);
  assert.match(result.sha256, /^[a-f0-9]{64}$/);
});

test('rejects traversal paths', async () => {
  const fixture = await makeZip({ 'manifest.json': validManifest, '../escape.txt': 'nope' });
  await expectInvalid(fixture.archive, 'unsafe path|traversal|relative path');
});

test('rejects hidden and AppleDouble files', async () => {
  const fixture = await makeZip({ 'manifest.json': validManifest, '.DS_Store': 'nope' });
  await expectInvalid(fixture.archive, 'hidden paths');
});

test('rejects malformed manifests and undeclared capabilities', async () => {
  const manifest = { ...validManifest, commands: [{ id: 'run', title: 'Run', action: { type: 'shell', value: './run.sh' } }] };
  const fixture = await makeZip({ 'manifest.json': manifest, 'run.sh': '#!/bin/sh' });
  await expectInvalid(fixture.archive, 'not declared');
});

test('rejects executable payloads and nested archives', async () => {
  const executable = await makeZip({ 'manifest.json': validManifest, 'payload.dylib': 'nope' });
  await expectInvalid(executable.archive, 'compiled executable');
  const nested = await makeZip({ 'manifest.json': validManifest, 'nested.zip': 'nope' });
  await expectInvalid(nested.archive, 'nested archives');
});

test('rejects packages whose root does not match the manifest id', async () => {
  const fixture = await makeZip({ 'manifest.json': validManifest }, 'wrong-root');
  await expectInvalid(fixture.archive, 'root');
});

test('rejects manifests whose total entry size exceeds the manifest limit', async () => {
  const paddedManifest = `${JSON.stringify(validManifest)}${' '.repeat(512 * 1024)}`;
  const fixture = await makeZip({ 'manifest.json': paddedManifest });
  await expectInvalid(fixture.archive, 'manifest.json is too large');
});
