const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

describe('Main Scripts (cross-browser compatible)', () => {
  test('content.js uses browserAPI compatibility shim', () => {
    const content = fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8');
    assert.ok(content.includes('browserAPI'), 'should use browserAPI shim');
    assert.ok(content.includes("typeof browser !== 'undefined'"), 'should have browser detection');
    assert.ok(content.includes('browserAPI.storage'), 'should use browserAPI.storage');
    assert.ok(content.includes('browserAPI.runtime'), 'should use browserAPI.runtime');
  });

  test('popup.js uses browserAPI compatibility shim', () => {
    const content = fs.readFileSync(path.join(ROOT, 'popup.js'), 'utf8');
    assert.ok(content.includes('browserAPI'), 'should use browserAPI shim');
    assert.ok(content.includes('browserAPI.storage'), 'should use browserAPI.storage');
    assert.ok(content.includes('browserAPI.tabs'), 'should use browserAPI.tabs');
  });

  test('content.js has theme application logic', () => {
    const content = fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8');
    assert.ok(content.includes('applyTheme'), 'should have applyTheme function');
    assert.ok(content.includes('dbc-theme-'), 'should use theme class prefix');
  });

  test('popup.js has theme selection logic', () => {
    const content = fs.readFileSync(path.join(ROOT, 'popup.js'), 'utf8');
    assert.ok(content.includes('selectTheme'), 'should have selectTheme function');
    assert.ok(content.includes('saveTheme'), 'should have saveTheme function');
  });
});

describe('Chrome-specific Scripts (legacy)', () => {
  test('content.chrome.js uses chrome API', () => {
    const content = fs.readFileSync(path.join(ROOT, 'content.chrome.js'), 'utf8');
    assert.ok(content.includes('chrome.storage'), 'should use chrome.storage');
    assert.ok(content.includes('chrome.runtime'), 'should use chrome.runtime');
  });

  test('popup.chrome.js uses chrome API', () => {
    const content = fs.readFileSync(path.join(ROOT, 'popup.chrome.js'), 'utf8');
    assert.ok(content.includes('chrome.storage'), 'should use chrome.storage');
    assert.ok(content.includes('chrome.tabs'), 'should use chrome.tabs');
  });

  test('chrome/ folder has correct files', () => {
    const chromeDir = path.join(ROOT, 'chrome');
    if (fs.existsSync(chromeDir)) {
      assert.ok(fs.existsSync(path.join(chromeDir, 'manifest.json')));
      assert.ok(fs.existsSync(path.join(chromeDir, 'content.js')));
      assert.ok(fs.existsSync(path.join(chromeDir, 'popup.js')));
      assert.ok(fs.existsSync(path.join(chromeDir, 'popup.html')));

      // Verify chrome/content.js uses chrome API
      const chromeContent = fs.readFileSync(path.join(chromeDir, 'content.js'), 'utf8');
      assert.ok(chromeContent.includes('chrome.storage'), 'chrome/content.js should use chrome API');
    }
  });
});

describe('Popup HTML', () => {
  test('popup.html has all theme options', () => {
    const content = fs.readFileSync(path.join(ROOT, 'popup.html'), 'utf8');
    const themes = ['classic', 'dark', 'light', 'cyberpunk', 'diggit'];

    for (const theme of themes) {
      assert.ok(
        content.includes(`data-theme="${theme}"`),
        `should have ${theme} theme option`
      );
    }
  });

  test('popup.html references popup.js', () => {
    const content = fs.readFileSync(path.join(ROOT, 'popup.html'), 'utf8');
    assert.ok(content.includes('popup.js'), 'should reference popup.js');
  });
});
