const { test, describe } = require('node:test');
const assert = require('node:assert');

const {
  parseCustomPalette,
  isValidHexColor,
  getEffectFlags,
  getModeColors,
  generateGlowCSS,
  generateOutlineCSS,
  generateDarkModeOverlay,
  generateChevronCSS,
  generateCustomCSS
} = require('../lib/theme-utils');

describe('parseCustomPalette', () => {
  test('parses basic color palette', () => {
    const result = parseCustomPalette('#ff0000,#00ff00,#0000ff');
    assert.strictEqual(result.upvote, '#ff0000');
    assert.strictEqual(result.downvote, '#00ff00');
    assert.strictEqual(result.neutral, '#0000ff');
    assert.deepStrictEqual(result.effects, []);
  });

  test('parses palette with effects', () => {
    const result = parseCustomPalette('#ff0000,#00ff00,#0000ff;glow,bold');
    assert.strictEqual(result.upvote, '#ff0000');
    assert.strictEqual(result.downvote, '#00ff00');
    assert.strictEqual(result.neutral, '#0000ff');
    assert.deepStrictEqual(result.effects, ['glow', 'bold']);
  });

  test('normalizes effect names to lowercase', () => {
    const result = parseCustomPalette('#fff,#000,#888;GLOW,Bold,DARK');
    assert.deepStrictEqual(result.effects, ['glow', 'bold', 'dark']);
  });

  test('handles missing colors with defaults', () => {
    const result = parseCustomPalette('#ff0000');
    assert.strictEqual(result.upvote, '#ff0000');
    assert.strictEqual(result.downvote, '#7193ff');
    assert.strictEqual(result.neutral, '#878a8c');
  });

  test('handles empty string', () => {
    const result = parseCustomPalette('');
    assert.strictEqual(result.upvote, '#ff6f00');
    assert.strictEqual(result.downvote, '#7193ff');
    assert.strictEqual(result.neutral, '#878a8c');
    assert.deepStrictEqual(result.effects, []);
  });

  test('handles null/undefined', () => {
    const result1 = parseCustomPalette(null);
    const result2 = parseCustomPalette(undefined);
    assert.strictEqual(result1.upvote, '#ff6f00');
    assert.strictEqual(result2.upvote, '#ff6f00');
  });

  test('trims whitespace from colors and effects', () => {
    const result = parseCustomPalette(' #ff0000 , #00ff00 , #0000ff ; glow , bold ');
    assert.strictEqual(result.upvote, '#ff0000');
    assert.strictEqual(result.downvote, '#00ff00');
    assert.strictEqual(result.neutral, '#0000ff');
    assert.deepStrictEqual(result.effects, ['glow', 'bold']);
  });

  test('parses all supported effects', () => {
    const result = parseCustomPalette('#fff,#000,#888;classic,dark,glow,bold,outline');
    assert.deepStrictEqual(result.effects, ['classic', 'dark', 'glow', 'bold', 'outline']);
  });
});

describe('isValidHexColor', () => {
  test('accepts valid 6-digit hex colors', () => {
    assert.strictEqual(isValidHexColor('#ff0000'), true);
    assert.strictEqual(isValidHexColor('#FFFFFF'), true);
    assert.strictEqual(isValidHexColor('#000000'), true);
    assert.strictEqual(isValidHexColor('#AbCdEf'), true);
  });

  test('accepts valid 3-digit hex colors', () => {
    assert.strictEqual(isValidHexColor('#fff'), true);
    assert.strictEqual(isValidHexColor('#000'), true);
    assert.strictEqual(isValidHexColor('#F0F'), true);
  });

  test('rejects invalid colors', () => {
    assert.strictEqual(isValidHexColor('ff0000'), false);
    assert.strictEqual(isValidHexColor('#ff00'), false);
    assert.strictEqual(isValidHexColor('#ff00000'), false);
    assert.strictEqual(isValidHexColor('red'), false);
    assert.strictEqual(isValidHexColor('rgb(255,0,0)'), false);
    assert.strictEqual(isValidHexColor('#gggggg'), false);
  });

  test('rejects null/undefined/empty', () => {
    assert.strictEqual(isValidHexColor(null), false);
    assert.strictEqual(isValidHexColor(undefined), false);
    assert.strictEqual(isValidHexColor(''), false);
  });
});

describe('getEffectFlags', () => {
  test('returns correct flags for effects array', () => {
    const flags = getEffectFlags(['glow', 'bold', 'dark', 'chevron']);
    assert.strictEqual(flags.hasGlow, true);
    assert.strictEqual(flags.hasBold, true);
    assert.strictEqual(flags.hasDark, true);
    assert.strictEqual(flags.hasChevron, true);
    assert.strictEqual(flags.hasOutline, false);
    assert.strictEqual(flags.hasClassic, false);
  });

  test('returns all false for empty array', () => {
    const flags = getEffectFlags([]);
    assert.strictEqual(flags.hasGlow, false);
    assert.strictEqual(flags.hasBold, false);
    assert.strictEqual(flags.hasOutline, false);
    assert.strictEqual(flags.hasClassic, false);
    assert.strictEqual(flags.hasDark, false);
    assert.strictEqual(flags.hasChevron, false);
  });

  test('handles non-array input', () => {
    const flags = getEffectFlags(null);
    assert.strictEqual(flags.hasGlow, false);
    assert.strictEqual(flags.hasBold, false);
    assert.strictEqual(flags.hasChevron, false);
  });
});

describe('getModeColors', () => {
  test('returns light mode colors when hasDark is false', () => {
    const colors = getModeColors(false);
    assert.ok(colors.containerBg.includes('#f8f8f8'));
    assert.strictEqual(colors.containerBorder, '#a0a0a0');
    assert.ok(colors.countBg.includes('#fff'));
    assert.strictEqual(colors.countColor, '#1a1a1a');
    assert.strictEqual(colors.countBorder, '#ccc');
  });

  test('returns dark mode colors when hasDark is true', () => {
    const colors = getModeColors(true);
    assert.ok(colors.containerBg.includes('#2d2d2d'));
    assert.strictEqual(colors.containerBorder, '#444');
    assert.ok(colors.countBg.includes('#333'));
    assert.strictEqual(colors.countColor, '#e0e0e0');
    assert.strictEqual(colors.countBorder, '#444');
  });
});

describe('generateGlowCSS', () => {
  test('returns empty string when hasGlow is false', () => {
    assert.strictEqual(generateGlowCSS('#ff0000', false), '');
  });

  test('returns glow CSS when hasGlow is true', () => {
    const css = generateGlowCSS('#ff0000', true);
    assert.ok(css.includes('filter:'));
    assert.ok(css.includes('drop-shadow'));
    assert.ok(css.includes('#ff0000'));
  });

  test('returns subtle glow when subtle flag is true', () => {
    const normalGlow = generateGlowCSS('#ff0000', true, false);
    const subtleGlow = generateGlowCSS('#ff0000', true, true);
    assert.ok(normalGlow.includes('8px'));
    assert.ok(subtleGlow.includes('3px'));
    assert.ok(!subtleGlow.includes('8px'));
  });
});

describe('generateOutlineCSS', () => {
  test('returns empty string when hasOutline is false', () => {
    assert.strictEqual(generateOutlineCSS('#ff0000', false), '');
  });

  test('returns outline CSS when hasOutline is true', () => {
    const css = generateOutlineCSS('#ff0000', true);
    assert.ok(css.includes('outline:'));
    assert.ok(css.includes('#ff0000'));
    assert.ok(css.includes('border-radius'));
  });
});

describe('generateDarkModeOverlay', () => {
  test('generates dark mode CSS', () => {
    const css = generateDarkModeOverlay();
    assert.ok(css.includes('Dark mode overlay'));
    assert.ok(css.includes('#2d2d2d'));
    assert.ok(css.includes('#1a1a1a'));
    assert.ok(css.includes('Vote on post'));
  });
});

describe('generateChevronCSS', () => {
  test('generates chevron arrow CSS with colors', () => {
    const css = generateChevronCSS('#ff0000', '#00ff00', '#888888', false);
    assert.ok(css.includes('Chevron Arrow Style'), 'should have chevron comment');
    assert.ok(css.includes('rotate(45deg)'), 'should rotate for chevron effect');
    assert.ok(css.includes('#ff0000'), 'should include upvote color');
    assert.ok(css.includes('#00ff00'), 'should include downvote color');
    assert.ok(css.includes('#888888'), 'should include neutral color');
  });

  test('generates chevron CSS with glow effect', () => {
    const css = generateChevronCSS('#ff0000', '#00ff00', '#888888', true);
    assert.ok(css.includes('drop-shadow'), 'should include glow effect');
  });

  test('hides SVG icons', () => {
    const css = generateChevronCSS('#ff0000', '#00ff00', '#888888', false);
    assert.ok(css.includes('display: none'), 'should hide SVG icons');
  });
});

describe('generateCustomCSS', () => {
  test('generates CSS with correct colors', () => {
    const css = generateCustomCSS('#ff0000,#00ff00,#0000ff');
    assert.ok(css.includes('#ff0000'), 'should include upvote color');
    assert.ok(css.includes('#00ff00'), 'should include downvote color');
    assert.ok(css.includes('#0000ff'), 'should include neutral color');
  });

  test('generates CSS with glow effect', () => {
    const css = generateCustomCSS('#ff0000,#00ff00,#0000ff;glow');
    assert.ok(css.includes('drop-shadow'), 'should include glow effect');
  });

  test('generates CSS with bold effect', () => {
    const css = generateCustomCSS('#ff0000,#00ff00,#0000ff;bold');
    assert.ok(css.includes('scale(1.2)'), 'should include scale transform');
  });

  test('generates CSS with outline effect', () => {
    const css = generateCustomCSS('#ff0000,#00ff00,#0000ff;outline');
    assert.ok(css.includes('outline:'), 'should include outline');
  });

  test('generates CSS with classic layout', () => {
    const css = generateCustomCSS('#ff0000,#00ff00,#0000ff;classic');
    assert.ok(css.includes('Classic Digg Layout'), 'should include classic layout');
    assert.ok(css.includes('position: absolute'), 'should position buttons absolutely');
    assert.ok(css.includes('padding-left: 70px'), 'should add left padding');
  });

  test('generates CSS with chevron style', () => {
    const css = generateCustomCSS('#ff0000,#00ff00,#0000ff;chevron');
    assert.ok(css.includes('Chevron Arrow Style'), 'should include chevron style');
    assert.ok(css.includes('rotate(45deg)'), 'should have rotated borders for chevrons');
  });

  test('generates CSS with dark mode in classic layout', () => {
    const css = generateCustomCSS('#ff0000,#00ff00,#0000ff;dark,classic');
    assert.ok(css.includes('#2d2d2d') || css.includes('#1a1a1a'), 'should use dark colors in classic layout');
  });

  test('includes palette comment', () => {
    const palette = '#ff0000,#00ff00,#0000ff;glow';
    const css = generateCustomCSS(palette);
    assert.ok(css.includes(`Palette: ${palette}`), 'should include palette as comment');
  });

  test('targets all required button selectors', () => {
    const css = generateCustomCSS('#ff0000,#00ff00,#0000ff');
    assert.ok(css.includes('Digg this post'), 'should target digg button');
    assert.ok(css.includes('Remove digg'), 'should target remove digg button');
    assert.ok(css.includes('Bury'), 'should target bury button');
    assert.ok(css.includes('Remove bury'), 'should target remove bury button');
    assert.ok(css.includes('Digg this comment'), 'should target comment digg button');
  });
});
