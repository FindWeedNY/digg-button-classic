const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const THEMES_DIR = path.join(__dirname, '..', 'themes');
const EXPECTED_THEMES = ['classic', 'dark', 'light', 'cyberpunk', 'diggit'];

describe('Themes', () => {
  test('all theme files exist', () => {
    for (const theme of EXPECTED_THEMES) {
      const themePath = path.join(THEMES_DIR, `${theme}.css`);
      assert.ok(fs.existsSync(themePath), `${theme}.css should exist`);
    }
  });

  test('theme files are not empty', () => {
    for (const theme of EXPECTED_THEMES) {
      const themePath = path.join(THEMES_DIR, `${theme}.css`);
      const content = fs.readFileSync(themePath, 'utf8');
      assert.ok(content.length > 100, `${theme}.css should have content`);
    }
  });

  test('themes target digg vote buttons', () => {
    const requiredSelectors = [
      'section[data-ggid]',
      'aria-label="Vote on post"',
      'aria-label="Digg this post"',
      'aria-label="Remove digg"'
    ];

    for (const theme of EXPECTED_THEMES) {
      const themePath = path.join(THEMES_DIR, `${theme}.css`);
      const content = fs.readFileSync(themePath, 'utf8');

      for (const selector of requiredSelectors) {
        assert.ok(
          content.includes(selector),
          `${theme}.css should include "${selector}"`
        );
      }
    }
  });

  test('themes hide original SVG icons', () => {
    for (const theme of EXPECTED_THEMES) {
      const themePath = path.join(THEMES_DIR, `${theme}.css`);
      const content = fs.readFileSync(themePath, 'utf8');
      assert.ok(
        content.includes('svg') && content.includes('display: none'),
        `${theme}.css should hide SVG icons`
      );
    }
  });

  test('themes use ::before for button text', () => {
    for (const theme of EXPECTED_THEMES) {
      const themePath = path.join(THEMES_DIR, `${theme}.css`);
      const content = fs.readFileSync(themePath, 'utf8');
      assert.ok(
        content.includes('::before'),
        `${theme}.css should use ::before pseudo-elements`
      );
    }
  });
});
