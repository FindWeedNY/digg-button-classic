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

  test('all themes handle bury button voted state with both detection methods', () => {
    // Digg uses two methods to indicate voted state:
    // 1. Changing aria-label from "Bury" to "Remove bury"
    // 2. Setting aria-pressed="true" on the same button
    for (const theme of EXPECTED_THEMES) {
      const themePath = path.join(THEMES_DIR, `${theme}.css`);
      const content = fs.readFileSync(themePath, 'utf8');

      // Should handle "Remove bury" label (method 1)
      assert.ok(
        content.includes('aria-label="Remove bury"'),
        `${theme}.css should handle "Remove bury" label for voted state`
      );

      // Should handle aria-pressed="true" on Bury button (method 2)
      assert.ok(
        content.includes('aria-label="Bury"][aria-pressed="true"') ||
        content.includes("aria-label=\"Bury\"][aria-pressed=\"true\""),
        `${theme}.css should handle aria-pressed="true" on Bury button for voted state`
      );
    }
  });

  test('all themes handle upvote button voted state with both detection methods', () => {
    for (const theme of EXPECTED_THEMES) {
      const themePath = path.join(THEMES_DIR, `${theme}.css`);
      const content = fs.readFileSync(themePath, 'utf8');

      // Should handle "Remove digg" label (method 1)
      assert.ok(
        content.includes('aria-label="Remove digg"'),
        `${theme}.css should handle "Remove digg" label for voted state`
      );

      // Should handle aria-pressed="true" on Digg button (method 2)
      assert.ok(
        content.includes('aria-label="Digg this post"][aria-pressed="true"') ||
        content.includes("aria-label=\"Digg this post\"][aria-pressed=\"true\""),
        `${theme}.css should handle aria-pressed="true" on upvote button for voted state`
      );
    }
  });
});
