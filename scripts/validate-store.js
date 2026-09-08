'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const childProcess = require('node:child_process');
const root = path.resolve(__dirname, '..');
const catalogPath = path.join(root, 'store', 'extensions.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.extensions)) throw new Error('Invalid store catalog schema');
const ids = new Set();
const urls = new Set();
for (const entry of catalog.extensions) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{1,127}$/.test(entry.id) || ids.has(entry.id)) throw new Error(`Invalid/duplicate ID: ${entry.id}`);
  ids.add(entry.id);
  if (!/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(entry.version)) throw new Error(`Invalid version: ${entry.id}`);
  if (!/^https:\/\/www\.liamhosfeld\.com\/store\/packages\/[a-z0-9][a-z0-9.-]{0,127}\.zip$/i.test(entry.downloadURL) || urls.has(entry.downloadURL)) throw new Error(`Invalid/duplicate URL: ${entry.id}`);
  urls.add(entry.downloadURL);
  if (!/^[a-f0-9]{64}$/i.test(entry.sha256) || !Number.isInteger(entry.size) || entry.size <= 0) throw new Error(`Invalid digest/size: ${entry.id}`);
  const packageName = entry.downloadURL.split('/').pop();
  const packagePath = path.join(root, 'store', 'packages', packageName);
  const stat = fs.statSync(packagePath);
  if (stat.size !== entry.size) throw new Error(`Size mismatch: ${entry.id}`);
  const digest = crypto.createHash('sha256').update(fs.readFileSync(packagePath)).digest('hex');
  if (digest !== entry.sha256.toLowerCase()) throw new Error(`Digest mismatch: ${entry.id}`);
  const listed = childProcess.execFileSync('/usr/bin/unzip', ['-Z1', packagePath], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
  if (listed.length !== 2 || listed[0] !== `${entry.id}/` || listed[1] !== `${entry.id}/manifest.json`) throw new Error(`Invalid package entries: ${entry.id}`);
  const manifest = JSON.parse(childProcess.execFileSync('/usr/bin/unzip', ['-p', packagePath, `${entry.id}/manifest.json`], { encoding: 'utf8' }));
  if (manifest.id !== entry.id || manifest.name !== entry.name || manifest.version !== entry.version || ![1, 2].includes(manifest.schemaVersion)) throw new Error(`Manifest mismatch: ${entry.id}`);
  for (const command of manifest.commands || []) {
    if (!command.action || !['application', 'clipboard', 'file', 'form', 'picker', 'shell', 'system', 'url', 'window', 'workspace'].includes(command.action.type)) throw new Error(`Invalid action type: ${entry.id}`);
  }
}
console.log(`Validated ${catalog.extensions.length} Lima extension packages.`);
