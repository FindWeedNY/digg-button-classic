const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

describe('Main Manifest (MV3 - works in both Chrome and Firefox)', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));

  test('has required fields', () => {
    assert.strictEqual(manifest.manifest_version, 3);
    assert.ok(manifest.name);
    assert.ok(manifest.version);
    assert.ok(manifest.description);
  });

  test('has valid version format', () => {
    assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  });

  test('has action for popup (MV3)', () => {
    assert.ok(manifest.action);
    assert.ok(manifest.action.default_popup);
  });

  test('has content_scripts for digg.com', () => {
    assert.ok(manifest.content_scripts);
    assert.ok(manifest.content_scripts[0].matches.includes('*://digg.com/*'));
  });

  test('has required permissions', () => {
    assert.ok(manifest.permissions.includes('storage'));
  });

  test('has host_permissions for digg.com', () => {
    assert.ok(manifest.host_permissions);
    assert.ok(manifest.host_permissions.includes('*://digg.com/*'));
  });

  test('has web_accessible_resources in MV3 format', () => {
    assert.ok(Array.isArray(manifest.web_accessible_resources));
    assert.ok(manifest.web_accessible_resources[0].resources);
    assert.ok(manifest.web_accessible_resources[0].matches);
  });

  test('references existing files', () => {
    const popup = manifest.action.default_popup;
    assert.ok(fs.existsSync(path.join(ROOT, popup)), `${popup} should exist`);

    const contentScript = manifest.content_scripts[0].js[0];
    assert.ok(fs.existsSync(path.join(ROOT, contentScript)), `${contentScript} should exist`);
  });

  test('has Firefox-specific settings', () => {
    assert.ok(manifest.browser_specific_settings);
    assert.ok(manifest.browser_specific_settings.gecko);
    assert.ok(manifest.browser_specific_settings.gecko.id);
  });
});

describe('Chrome Manifest (legacy)', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.chrome.json'), 'utf8'));

  test('uses manifest v3', () => {
    assert.strictEqual(manifest.manifest_version, 3);
  });

  test('has action instead of browser_action', () => {
    assert.ok(manifest.action);
    assert.ok(manifest.action.default_popup);
  });

  test('has host_permissions for digg.com', () => {
    assert.ok(manifest.host_permissions);
    assert.ok(manifest.host_permissions.includes('*://digg.com/*'));
  });

  test('has web_accessible_resources in v3 format', () => {
    assert.ok(Array.isArray(manifest.web_accessible_resources));
    assert.ok(manifest.web_accessible_resources[0].resources);
    assert.ok(manifest.web_accessible_resources[0].matches);
  });
});
