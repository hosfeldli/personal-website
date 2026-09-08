'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const fsp = fs.promises;
const os = require('node:os');
const path = require('node:path');
const yauzl = require('yauzl');

const LIMITS = Object.freeze({
  compressedBytes: 20 * 1024 * 1024,
  extractedBytes: 50 * 1024 * 1024,
  entries: 128,
  manifestBytes: 512 * 1024,
  compressionRatio: 100,
});

const TOP_LEVEL_KEYS = new Set([
  'schemaVersion', 'id', 'name', 'version', 'description', 'pack', 'category',
  'bundled', 'provenance', 'trust', 'capabilities', 'commands',
]);
const COMMAND_KEYS = new Set(['id', 'title', 'subtitle', 'keywords', 'icon', 'hotkey', 'runInBackground', 'action']);
const ACTION_KEYS = new Set([
  'type', 'value', 'operation', 'target', 'confirmation', 'parameters',
  'arguments', 'workingDirectory', 'form', 'chain',
]);
const FORM_KEYS = new Set(['title', 'submitLabel', 'fields', 'execution']);
const FIELD_KEYS = new Set([
  'id', 'label', 'type', 'placeholder', 'defaultValue', 'options', 'required',
  'section', 'helpText', 'minimum', 'maximum', 'visibleWhen',
]);
const VISIBILITY_KEYS = new Set(['field', 'equals', 'notEquals']);
const EXECUTION_KEYS = new Set(['type', 'executable', 'arguments', 'workingDirectory', 'timeoutSeconds']);
const CAPABILITIES = new Set([
  'network', 'shell', 'filesystem', 'clipboard', 'selectedText', 'accessibility',
  'processControl', 'systemControl', 'externalExecution',
]);
const ACTION_TYPES = new Set([
  'application', 'clipboard', 'file', 'form', 'picker', 'shell', 'system',
  'url', 'window', 'workspace',
]);
const FIELD_TYPES = new Set([
  'text', 'secure', 'multiline', 'number', 'toggle', 'picker', 'file',
  'directory', 'date', 'slider', 'keyValue',
]);
const ARCHIVE_SUFFIXES = new Set([
  '.zip', '.tar', '.tgz', '.gz', '.bz2', '.xz', '.7z', '.rar', '.dmg', '.pkg',
]);
const EXECUTABLE_SUFFIXES = new Set([
  '.app', '.bundle', '.framework', '.dylib', '.so', '.o', '.a', '.exe', '.dll',
]);

class SubmissionValidationError extends Error {
  constructor(message, code = 'invalid_package') {
    super(message);
    this.name = 'SubmissionValidationError';
    this.code = code;
  }
}

function assert(condition, message) {
  if (!condition) throw new SubmissionValidationError(message);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function checkKeys(value, allowed, label) {
  assert(isObject(value), `${label} must be an object.`);
  for (const key of Object.keys(value)) {
    assert(allowed.has(key), `${label} contains unsupported field "${key}".`);
  }
}

function string(value, label, { min = 0, max = 4096 } = {}) {
  assert(typeof value === 'string', `${label} must be a string.`);
  assert(value.length >= min && value.length <= max, `${label} has an invalid length.`);
  assert(!/[\u0000-\u001f\u007f]/.test(value), `${label} contains control characters.`);
  return value;
}

function optionalString(value, label, options) {
  if (value === undefined) return;
  string(value, label, options);
}

function validateManifest(manifest) {
  checkKeys(manifest, TOP_LEVEL_KEYS, 'manifest');
  assert(Number.isInteger(manifest.schemaVersion) && [1, 2].includes(manifest.schemaVersion), 'schemaVersion must be 1 or 2.');
  string(manifest.id, 'manifest.id', { min: 1, max: 128 });
  assert(/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(manifest.id), 'manifest.id contains unsupported characters.');
  string(manifest.name, 'manifest.name', { min: 1, max: 120 });
  assert(manifest.name.trim().length > 0, 'manifest.name cannot be blank.');
  if (manifest.version !== undefined) {
    string(manifest.version, 'manifest.version', { min: 1, max: 64 });
    assert(/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(manifest.version), 'manifest.version must use semantic version syntax.');
  }
  for (const field of ['description', 'pack', 'category']) optionalString(manifest[field], `manifest.${field}`, { min: field === 'description' ? 0 : 1, max: 240 });
  if (manifest.bundled !== undefined) assert(manifest.bundled === false, 'Submitted extensions cannot declare themselves bundled.');
  if (manifest.provenance !== undefined) assert(manifest.provenance !== 'bundled', 'Submitted extensions cannot declare bundled provenance.');
  if (manifest.trust !== undefined) assert(!['bundled', 'builtIn'].includes(manifest.trust), 'Submitted extensions cannot declare built-in trust.');

  const capabilities = manifest.capabilities === undefined ? [] : manifest.capabilities;
  assert(Array.isArray(capabilities) && new Set(capabilities).size === capabilities.length, 'manifest.capabilities must be a unique array.');
  for (const capability of capabilities) assert(CAPABILITIES.has(capability), `Unsupported capability: ${capability}.`);
  const capabilitySet = new Set(capabilities);

  assert(Array.isArray(manifest.commands) && manifest.commands.length >= 1 && manifest.commands.length <= 64, 'manifest.commands must contain between 1 and 64 commands.');
  const commandIDs = new Set();
  for (const command of manifest.commands) {
    checkKeys(command, COMMAND_KEYS, 'command');
    string(command.id, 'command.id', { min: 1, max: 128 });
    assert(/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(command.id), 'command.id contains unsupported characters.');
    assert(!commandIDs.has(command.id), `Duplicate command id: ${command.id}.`);
    commandIDs.add(command.id);
    string(command.title, 'command.title', { min: 1, max: 160 });
    for (const field of ['subtitle', 'icon', 'hotkey']) optionalString(command[field], `command.${field}`, { max: 240 });
    if (command.keywords !== undefined) {
      assert(Array.isArray(command.keywords) && command.keywords.length <= 64, 'command.keywords must be an array.');
      command.keywords.forEach((item) => string(item, 'command.keyword', { max: 100 }));
    }
    if (command.runInBackground !== undefined) assert(typeof command.runInBackground === 'boolean', 'command.runInBackground must be boolean.');
    validateAction(command.action, capabilitySet, 'command.action');
  }
  return { capabilities: capabilitySet };
}

function inferredCapabilities(action) {
  const result = new Set();
  switch (action.type) {
    case 'url': result.add('network'); break;
    case 'file': result.add('filesystem'); break;
    case 'application': result.add('processControl'); break;
    case 'shell': result.add('shell'); result.add('filesystem'); break;
    case 'clipboard':
      result.add('clipboard');
      if ((action.operation || 'copy') !== 'copy') result.add('accessibility');
      break;
    case 'picker':
      if (action.operation === 'emoji') { result.add('clipboard'); result.add('accessibility'); }
      if (action.operation === 'application') result.add('processControl');
      if (action.operation === 'display') result.add('accessibility');
      if (action.operation === 'file') result.add('filesystem');
      break;
    case 'system': result.add('systemControl'); break;
    case 'window': result.add('accessibility'); break;
    case 'workspace':
      if (action.operation === 'writingReview') {
        result.add('selectedText'); result.add('clipboard'); result.add('accessibility');
      }
      if (action.operation === 'focusedFileLauncher') result.add('filesystem');
      break;
    case 'form': result.add('shell'); result.add('filesystem'); break;
    default: break;
  }
  for (const nested of action.chain || []) for (const capability of inferredCapabilities(nested)) result.add(capability);
  return result;
}

function validateAction(action, capabilities, label, depth = 0) {
  checkKeys(action, ACTION_KEYS, label);
  assert(ACTION_TYPES.has(action.type), `${label}.type is unsupported.`);
  if (action.value !== undefined) string(action.value, `${label}.value`, { max: 4096 });
  for (const field of ['operation', 'target', 'workingDirectory']) optionalString(action[field], `${label}.${field}`, { max: 4096 });
  if (action.confirmation !== undefined) assert(typeof action.confirmation === 'boolean', `${label}.confirmation must be boolean.`);
  if (action.arguments !== undefined) {
    assert(Array.isArray(action.arguments) && action.arguments.length <= 64, `${label}.arguments must be an array.`);
    action.arguments.forEach((item) => string(item, `${label}.argument`, { max: 4096 }));
  }
  if (action.parameters !== undefined) {
    assert(isObject(action.parameters), `${label}.parameters must be an object.`);
    assert(Object.keys(action.parameters).length <= 64, `${label}.parameters has too many keys.`);
    for (const [key, value] of Object.entries(action.parameters)) {
      assert(/^[A-Za-z0-9._-]{1,80}$/.test(key), `${label}.parameters contains an invalid key.`);
      string(value, `${label}.parameters.${key}`, { max: 4096 });
    }
  }
  if (depth > 8) throw new SubmissionValidationError('Action nesting is too deep.');
  if (action.chain !== undefined) {
    assert(Array.isArray(action.chain) && action.chain.length <= 8, `${label}.chain is too long.`);
    action.chain.forEach((nested, index) => validateAction(nested, capabilities, `${label}.chain[${index}]`, depth + 1));
  }
  if (action.form !== undefined) validateForm(action.form, capabilities, `${label}.form`);
  if (action.type === 'shell') {
    assert(typeof action.value === 'string' && action.value.trim().length > 0, `${label} shell actions need an executable.`);
    if (action.value.trim().startsWith('/')) assert(capabilities.has('externalExecution'), `${label} uses an external executable without externalExecution capability.`);
  }
  if (action.type === 'url') {
    assert(typeof action.value === 'string' && /^https?:\/\//i.test(action.value), `${label} URL actions must use http or https.`);
  }
  for (const capability of inferredCapabilities(action)) assert(capabilities.has(capability), `${label} requests capabilities that are not declared.`);
}

function validateForm(form, capabilities, label) {
  checkKeys(form, FORM_KEYS, label);
  for (const field of ['title', 'submitLabel']) optionalString(form[field], `${label}.${field}`, { max: 160 });
  assert(Array.isArray(form.fields) && form.fields.length >= 1 && form.fields.length <= 64, `${label}.fields must contain between 1 and 64 fields.`);
  const fieldIDs = new Set();
  for (const field of form.fields) {
    checkKeys(field, FIELD_KEYS, `${label}.field`);
    string(field.id, `${label}.field.id`, { min: 1, max: 128 });
    assert(!fieldIDs.has(field.id), `${label} contains duplicate field ids.`);
    fieldIDs.add(field.id);
    string(field.label, `${label}.field.label`, { min: 1, max: 160 });
    assert(FIELD_TYPES.has(field.type), `${label}.field.type is unsupported.`);
    for (const name of ['placeholder', 'defaultValue', 'section', 'helpText']) optionalString(field[name], `${label}.field.${name}`, { max: 4096 });
    if (field.options !== undefined) {
      assert(Array.isArray(field.options) && field.options.length <= 128, `${label}.field.options must be an array.`);
      field.options.forEach((item) => string(item, `${label}.field.option`, { max: 240 }));
    }
    if (field.required !== undefined) assert(typeof field.required === 'boolean', `${label}.field.required must be boolean.`);
    for (const name of ['minimum', 'maximum']) if (field[name] !== undefined) assert(typeof field[name] === 'number' && Number.isFinite(field[name]), `${label}.field.${name} must be a finite number.`);
    if (field.visibleWhen !== undefined) {
      checkKeys(field.visibleWhen, VISIBILITY_KEYS, `${label}.field.visibleWhen`);
      string(field.visibleWhen.field, `${label}.field.visibleWhen.field`, { min: 1, max: 128 });
      assert((field.visibleWhen.equals !== undefined) !== (field.visibleWhen.notEquals !== undefined), `${label}.field.visibleWhen needs exactly one comparison.`);
      optionalString(field.visibleWhen.equals, `${label}.field.visibleWhen.equals`, { max: 4096 });
      optionalString(field.visibleWhen.notEquals, `${label}.field.visibleWhen.notEquals`, { max: 4096 });
    }
  }
  checkKeys(form.execution, EXECUTION_KEYS, `${label}.execution`);
  assert(form.execution.type === 'shell', `${label}.execution.type must be shell.`);
  optionalString(form.execution.executable, `${label}.execution.executable`, { max: 4096 });
  assert(typeof form.execution.executable === 'string' && form.execution.executable.trim().length > 0, `${label}.execution needs an executable.`);
  if (form.execution.executable.trim().startsWith('/')) assert(capabilities.has('externalExecution'), `${label}.execution uses an external executable without externalExecution capability.`);
  if (form.execution.arguments !== undefined) {
    assert(Array.isArray(form.execution.arguments) && form.execution.arguments.length <= 64, `${label}.execution.arguments must be an array.`);
    form.execution.arguments.forEach((item) => string(item, `${label}.execution.argument`, { max: 4096 }));
  }
  optionalString(form.execution.workingDirectory, `${label}.execution.workingDirectory`, { max: 4096 });
  if (form.execution.timeoutSeconds !== undefined) assert(Number.isInteger(form.execution.timeoutSeconds) && form.execution.timeoutSeconds >= 0 && form.execution.timeoutSeconds <= 900, `${label}.execution.timeoutSeconds is invalid.`);
}

function validateArchivePath(name) {
  assert(typeof name === 'string' && name.length > 0 && name.length <= 512, 'The archive contains an invalid path.');
  assert(!name.startsWith('/') && !name.includes('\\') && !name.includes('\0') && !name.includes('//'), 'The archive contains an unsafe path.');
  const components = name.split('/');
  const isDirectory = name.endsWith('/');
  const clean = components.filter(Boolean);
  assert(clean.length > 0 && clean.every((part) => part !== '.' && part !== '..' && !part.startsWith('.') && !/[\u0000-\u001f\u007f]/.test(part)), 'The archive contains traversal or hidden paths.');
  return { components: clean, isDirectory };
}

function isUnsafeEntry(entry, isDirectory) {
  const madeBy = (entry.versionMadeBy >>> 8) & 0xff;
  if (madeBy === 3) {
    const mode = (entry.externalFileAttributes >>> 16) & 0xffff;
    const kind = mode & 0o170000;
    if (kind !== 0 && kind !== 0o100000 && kind !== 0o040000) return true;
    if (kind === 0o120000) return true;
    if (isDirectory && kind === 0o100000) return true;
  }
  return false;
}

function readEntry(zipfile, entry) {
  return new Promise((resolve, reject) => {
    zipfile.openReadStream(entry, (error, stream) => {
      if (error) return reject(error);
      const chunks = [];
      let total = 0;
      stream.on('data', (chunk) => {
        total += chunk.length;
        if (total <= LIMITS.manifestBytes) chunks.push(chunk);
      });
      stream.once('error', reject);
      stream.once('end', () => resolve(Buffer.concat(chunks)));
    });
  });
}

function readManifestFromZip(filePath, manifestName) {
  return new Promise((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true, strictFileNames: true }, (error, zipfile) => {
      if (error) return reject(new SubmissionValidationError('The uploaded file is not a readable ZIP archive.'));
      let found = false;
      const finish = (failure) => { try { zipfile.close(); } catch {} if (failure) reject(failure); };
      zipfile.on('error', (err) => finish(new SubmissionValidationError(`The ZIP archive could not be read: ${err.message}`)));
      zipfile.on('entry', (entry) => {
        if (entry.fileName !== manifestName) return zipfile.readEntry();
        found = true;
        zipfile.openReadStream(entry, (streamError, stream) => {
          if (streamError) return finish(streamError);
          const chunks = [];
          let total = 0;
          stream.on('data', (chunk) => { total += chunk.length; if (total <= LIMITS.manifestBytes) chunks.push(chunk); });
          stream.once('error', finish);
          stream.once('end', () => { try { zipfile.close(); } catch {} resolve({ data: Buffer.concat(chunks), size: total }); });
        });
      });
      zipfile.on('end', () => { if (!found) finish(new SubmissionValidationError('manifest.json is missing.')); });
      zipfile.readEntry();
    });
  });
}

function inspectZip(filePath) {
  return new Promise((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true, strictFileNames: true }, (error, zipfile) => {
      if (error) return reject(new SubmissionValidationError('The uploaded file is not a readable ZIP archive.'));
      const entries = [];
      const names = new Set();
      const roots = new Set();
      let totalUncompressed = 0;
      let manifestEntry = null;
      let settled = false;
      const fail = (reason) => {
        if (settled) return;
        settled = true;
        try { zipfile.close(); } catch {}
        reject(reason instanceof Error ? reason : new SubmissionValidationError(reason));
      };
      zipfile.on('error', (err) => fail(new SubmissionValidationError(`The ZIP archive could not be read: ${err.message}`)));
      zipfile.on('entry', (entry) => {
        if (settled) return;
        try {
          assert(entries.length < LIMITS.entries, `The archive contains more than ${LIMITS.entries} files.`);
          const { components, isDirectory } = validateArchivePath(entry.fileName);
          assert(!names.has(entry.fileName), 'The archive contains duplicate paths.');
          names.add(entry.fileName);
          assert(!(entry.generalPurposeBitFlag & 0x1), 'Encrypted ZIP archives are not accepted.');
          assert(!isUnsafeEntry(entry, isDirectory), 'The archive contains a symlink or special file.');
          const compressed = Number(entry.compressedSize);
          const uncompressed = Number(entry.uncompressedSize);
          assert(Number.isSafeInteger(compressed) && Number.isSafeInteger(uncompressed), 'The archive contains an invalid file size.');
          totalUncompressed += uncompressed;
          assert(totalUncompressed <= LIMITS.extractedBytes, 'The archive expands beyond the allowed size.');
          if (compressed === 0 && uncompressed > 0) throw new SubmissionValidationError('The archive contains an invalid compressed entry.');
          if (compressed > 0 && uncompressed > 1_048_576 && uncompressed / compressed > LIMITS.compressionRatio) throw new SubmissionValidationError('The archive has an unsafe compression ratio.');
          roots.add(components[0]);
          if (components.length === 2 && components[1] === 'manifest.json' && !isDirectory) {
            assert(!manifestEntry, 'The archive contains more than one manifest.');
            manifestEntry = entry;
          }
          if (ARCHIVE_SUFFIXES.has(path.extname(components[components.length - 1]).toLowerCase())) throw new SubmissionValidationError('Nested archives and installer images are not accepted.');
          if (EXECUTABLE_SUFFIXES.has(path.extname(components[components.length - 1]).toLowerCase())) throw new SubmissionValidationError('Compiled executable payloads are not accepted.');
          entries.push({ name: entry.fileName, isDirectory, compressed, uncompressed });
          zipfile.readEntry();
        } catch (validationError) {
          fail(validationError);
        }
      });
      zipfile.on('end', async () => {
        if (settled) return;
        try {
          assert(entries.length > 0 && roots.size === 1, 'The archive must contain exactly one package root.');
          assert(manifestEntry, 'The package root must contain manifest.json.');
          const root = [...roots][0];
          assert(root === root.replace(/\/$/, ''), 'The package root is invalid.');
          zipfile.close();
          const manifestResult = await readManifestFromZip(filePath, manifestEntry.fileName);
          assert(manifestResult.size <= LIMITS.manifestBytes, 'manifest.json is too large.');
          let manifest;
          try { manifest = JSON.parse(manifestResult.data.toString('utf8')); } catch { throw new SubmissionValidationError('manifest.json is not valid JSON.'); }
          const result = validateManifest(manifest);
          assert(root === manifest.id, 'The package root must exactly match manifest.id.');
          resolve({
            manifest,
            capabilities: [...result.capabilities].sort(),
            entries,
            totalUncompressed,
          });
        } catch (validationError) {
          fail(validationError);
        }
      });
      zipfile.readEntry();
    });
  });
}

async function sha256(filePath) {
  const hash = crypto.createHash('sha256');
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.once('error', reject);
    stream.once('end', resolve);
  });
  return hash.digest('hex');
}

async function inspectExtensionArchive(filePath) {
  const stats = await fsp.stat(filePath);
  assert(stats.isFile(), 'The uploaded package is not a regular file.');
  assert(stats.size > 0 && stats.size <= LIMITS.compressedBytes, 'The package exceeds the upload size limit.');
  const archive = await inspectZip(filePath);
  return {
    ...archive,
    size: stats.size,
    sha256: await sha256(filePath),
  };
}

function submissionRoot() {
  return process.env.LIMA_SUBMISSIONS_DIR || path.join(__dirname, 'data', 'extension-submissions');
}

async function saveSubmission(filePath, metadata) {
  const id = crypto.randomUUID();
  if (process.env.LIMA_EXTENSION_SUBMISSION_BUCKET) {
    const { Storage } = require('@google-cloud/storage');
    const storage = new Storage();
    const bucket = storage.bucket(process.env.LIMA_EXTENSION_SUBMISSION_BUCKET);
    const prefix = `quarantine/${new Date().toISOString().slice(0, 10)}/${id}`;
    await bucket.upload(filePath, {
      destination: `${prefix}.zip`,
      metadata: { contentType: 'application/zip', cacheControl: 'no-store', metadata: { status: 'pending-review' } },
      resumable: false,
    });
    await bucket.file(`${prefix}.json`).save(JSON.stringify({ ...metadata, id, status: 'pending-review', storedAt: new Date().toISOString() }, null, 2), {
      contentType: 'application/json',
      resumable: false,
    });
    return { id, storage: 'gcs', object: `${prefix}.zip` };
  }
  if (process.env.K_SERVICE) throw new Error('LIMA_EXTENSION_SUBMISSION_BUCKET is required in Cloud Run.');
  const root = submissionRoot();
  await fsp.mkdir(root, { recursive: true, mode: 0o700 });
  const destination = path.join(root, `${id}.zip`);
  const metadataPath = path.join(root, `${id}.json`);
  await fsp.copyFile(filePath, destination, fs.constants.COPYFILE_EXCL);
  await fsp.writeFile(metadataPath, JSON.stringify({ ...metadata, id, status: 'pending-review', storedAt: new Date().toISOString() }, null, 2), { mode: 0o600 });
  return { id, storage: 'local-quarantine' };
}

module.exports = {
  LIMITS,
  SubmissionValidationError,
  inspectExtensionArchive,
  saveSubmission,
  validateManifest,
};
