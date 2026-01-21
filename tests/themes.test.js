const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const THEMES_DIR = path.join(__dirname, '..', 'themes');
const EXPECTED_THEMES = ['classic', 'cyberpunk', 'diggit', 'minimal', 'chevron'];

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

  test('classic-style themes target digg vote buttons with full selectors', () => {
    const classicStyleThemes = ['classic', 'cyberpunk', 'diggit'];
    const requiredSelectors = [
      'section[data-ggid]',
      'aria-label="Vote on post"',
      'aria-label="Digg this post"',
      'aria-label="Remove digg"'
    ];

    for (const theme of classicStyleThemes) {
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

  test('classic-style themes hide SVG and use ::before', () => {
    const classicStyleThemes = ['classic', 'cyberpunk', 'diggit'];
    for (const theme of classicStyleThemes) {
      const themePath = path.join(THEMES_DIR, `${theme}.css`);
      const content = fs.readFileSync(themePath, 'utf8');
      assert.ok(
        content.includes('svg') && content.includes('display: none'),
        `${theme}.css should hide SVG icons`
      );
      assert.ok(
        content.includes('::before'),
        `${theme}.css should use ::before pseudo-elements`
      );
    }
  });

  test('minimal-style themes keep default layout', () => {
    const minimalStyleThemes = ['minimal', 'chevron'];
    for (const theme of minimalStyleThemes) {
      const themePath = path.join(THEMES_DIR, `${theme}.css`);
      const content = fs.readFileSync(themePath, 'utf8');
      // These themes style buttons but don't hide SVGs or reposition
      assert.ok(
        content.includes('Digg this post'),
        `${theme}.css should target vote buttons`
      );
    }
  });
});
