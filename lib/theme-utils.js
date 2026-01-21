// Digg Button Classic - Theme Utilities
// Shared functions for parsing and generating custom themes

/**
 * Parse a custom palette string into colors and effects
 * Format: "#upArrow,#downArrow,#neutral,#upBg,#downBg,#neutralBg;effect1,effect2"
 * Positions 1-3 are arrow colors, positions 4-6 are optional background colors
 * @param {string} paletteStr - The palette string to parse
 * @returns {Object} Parsed palette with arrow colors, background colors, and effects array
 */
function parseCustomPalette(paletteStr) {
  if (!paletteStr || typeof paletteStr !== 'string') {
    return {
      upvote: '#ff6f00',
      downvote: '#7193ff',
      neutral: '#878a8c',
      upvoteBg: null,
      downvoteBg: null,
      neutralBg: null,
      effects: []
    };
  }

  const [colorPart, effectPart] = paletteStr.split(';');
  const colors = colorPart.split(',').map(c => c.trim());
  const effects = effectPart ? effectPart.split(',').map(e => e.trim().toLowerCase()) : [];

  return {
    upvote: colors[0] || '#ff6f00',
    downvote: colors[1] || '#7193ff',
    neutral: colors[2] || '#878a8c',
    upvoteBg: colors[3] || null,
    downvoteBg: colors[4] || null,
    neutralBg: colors[5] || null,
    effects: effects
  };
}

/**
 * Check if a string is a valid hex color
 * @param {string} color - The color string to validate
 * @returns {boolean} True if valid hex color
 */
function isValidHexColor(color) {
  if (!color || typeof color !== 'string') return false;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

/**
 * Get effect flags from effects array
 * @param {string[]} effects - Array of effect names
 * @returns {Object} Object with boolean flags for each effect
 */
function getEffectFlags(effects) {
  const effectList = Array.isArray(effects) ? effects : [];
  return {
    hasGlow: effectList.includes('glow'),
    hasBold: effectList.includes('bold'),
    hasOutline: effectList.includes('outline'),
    hasClassic: effectList.includes('classic'),
    hasDark: effectList.includes('dark'),
    hasChevron: effectList.includes('chevron')
  };
}

/**
 * Generate mode-specific colors based on dark mode flag
 * @param {boolean} hasDark - Whether dark mode is enabled
 * @returns {Object} Color values for container, count, borders
 */
function getModeColors(hasDark) {
  return {
    containerBg: hasDark
      ? 'linear-gradient(180deg, #2d2d2d 0%, #1a1a1a 100%)'
      : 'linear-gradient(180deg, #f8f8f8 0%, #e5e5e5 100%)',
    containerBorder: hasDark ? '#444' : '#a0a0a0',
    countBg: hasDark
      ? 'linear-gradient(180deg, #333 0%, #222 100%)'
      : 'linear-gradient(180deg, #fff 0%, #f0f0f0 100%)',
    countColor: hasDark ? '#e0e0e0' : '#1a1a1a',
    countBorder: hasDark ? '#444' : '#ccc'
  };
}

/**
 * Generate glow effect CSS
 * @param {string} color - The color to use for glow
 * @param {boolean} hasGlow - Whether glow effect is enabled
 * @param {boolean} subtle - Whether to use subtle glow (for hover states)
 * @returns {string} CSS filter property or empty string
 */
function generateGlowCSS(color, hasGlow, subtle = false) {
  if (!hasGlow) return '';
  if (subtle) {
    return `filter: drop-shadow(0 0 3px ${color});`;
  }
  return `filter: drop-shadow(0 0 4px ${color}) drop-shadow(0 0 8px ${color});`;
}

/**
 * Generate outline effect CSS
 * @param {string} color - The color to use for outline
 * @param {boolean} hasOutline - Whether outline effect is enabled
 * @returns {string} CSS outline properties or empty string
 */
function generateOutlineCSS(color, hasOutline) {
  if (!hasOutline) return '';
  return `outline: 2px solid ${color}; outline-offset: 2px; border-radius: 4px;`;
}

/**
 * Generate dark mode overlay CSS for built-in themes
 * @returns {string} CSS for dark mode overlay
 */
function generateDarkModeOverlay() {
  return `
/* Dark mode overlay */
section[data-ggid] div[role="group"][aria-label="Vote on post"] {
  background: linear-gradient(180deg, #2d2d2d 0%, #1a1a1a 100%) !important;
  border-color: #444 !important;
}

div[role="group"][aria-label="Vote on post"] > span[aria-label$="diggs"] {
  background: linear-gradient(180deg, #333 0%, #222 100%) !important;
  color: #e0e0e0 !important;
  border-color: #444 !important;
}`;
}

/**
 * Generate the classic layout CSS
 * @param {Object} modeColors - Colors from getModeColors
 * @returns {string} CSS for classic digg-style layout
 */
function generateClassicLayoutCSS(modeColors) {
  const { containerBg, containerBorder, countBg, countColor, countBorder } = modeColors;

  return `
/* Classic Digg Layout - Repositioned to left */
section[data-ggid] {
  position: relative !important;
  padding-left: 70px !important;
}

section[data-ggid] div[role="group"][aria-label="Vote on post"] {
  position: absolute !important;
  left: 0 !important;
  top: 24px !important;
  flex-direction: column !important;
  align-items: stretch !important;
  gap: 0 !important;
  background: ${containerBg} !important;
  border: 1px solid ${containerBorder} !important;
  border-radius: 5px !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15) !important;
  padding: 0 !important;
  width: 60px !important;
  min-width: 60px !important;
  overflow: hidden !important;
  z-index: 10 !important;
}

div[role="group"][aria-label="Vote on post"] > span[aria-label$="diggs"] {
  display: block !important;
  background: ${countBg} !important;
  color: ${countColor} !important;
  font-size: 20px !important;
  font-weight: 700 !important;
  padding: 8px 4px !important;
  text-align: center !important;
  border-bottom: 1px solid ${countBorder} !important;
  line-height: 1 !important;
  order: 1 !important;
}

section[data-ggid] div[role="group"][aria-label="Vote on post"] button {
  border-radius: 0 !important;
  margin: 0 !important;
  width: 100% !important;
}

section[data-ggid] div[role="group"][aria-label="Vote on post"] button svg {
  display: none !important;
}

button[aria-label="Digg this post"],
button[aria-label="Remove digg"] {
  order: 2 !important;
  padding: 6px 4px !important;
}

button[aria-label="Digg this post"]::before {
  content: 'digg';
  font-size: 11px;
  font-weight: 700;
  color: white;
  text-shadow: 0 -1px 0 rgba(0,0,0,0.3);
}

button[aria-label="Remove digg"]::before {
  content: 'dugg';
  font-size: 11px;
  font-weight: 700;
  color: white;
  text-shadow: 0 -1px 0 rgba(0,0,0,0.3);
}

button[aria-label="Bury"],
button[aria-label="Remove bury"] {
  order: 3 !important;
  padding: 4px !important;
  border-top: 1px solid rgba(0,0,0,0.1) !important;
}

button[aria-label="Bury"]::before {
  content: 'bury';
  font-size: 9px;
  font-weight: 700;
  color: white;
  text-shadow: 0 -1px 0 rgba(0,0,0,0.3);
}

button[aria-label="Remove bury"]::before {
  content: 'buried';
  font-size: 9px;
  font-weight: 700;
  color: white;
  text-shadow: 0 -1px 0 rgba(0,0,0,0.3);
}`;
}

/**
 * Generate chevron arrow CSS
 * @param {string} upvote - Upvote color
 * @param {string} downvote - Downvote color
 * @param {string} neutral - Neutral color
 * @param {boolean} hasGlow - Whether glow effect is enabled
 * @returns {string} CSS for chevron-style arrows
 */
function generateChevronCSS(upvote, downvote, neutral, hasGlow) {
  const glowUp = hasGlow ? `filter: drop-shadow(0 0 3px ${upvote});` : '';
  const glowDown = hasGlow ? `filter: drop-shadow(0 0 3px ${downvote});` : '';

  return `
/* Chevron Arrow Style */
/* Hide original SVG icons */
div[role="group"][aria-label="Vote on post"] button svg,
button[aria-label="Digg this comment"] svg,
button[aria-label="Remove comment digg"] svg {
  display: none !important;
}

/* Upvote chevron - unvoted */
button[aria-label="Digg this post"]::before {
  content: '';
  display: inline-block;
  width: 10px;
  height: 10px;
  border-left: 2.5px solid ${neutral};
  border-top: 2.5px solid ${neutral};
  transform: rotate(45deg);
  margin-top: 4px;
  transition: border-color 0.15s ease;
}

button[aria-label="Digg this post"]:hover::before {
  border-color: ${upvote};
  ${glowUp}
}

/* Upvote chevron - voted */
button[aria-label="Remove digg"]::before {
  content: '';
  display: inline-block;
  width: 10px;
  height: 10px;
  border-left: 2.5px solid ${upvote};
  border-top: 2.5px solid ${upvote};
  transform: rotate(45deg);
  margin-top: 4px;
  ${glowUp}
}

/* Downvote chevron - unvoted */
button[aria-label="Bury"]::before {
  content: '';
  display: inline-block;
  width: 10px;
  height: 10px;
  border-right: 2.5px solid ${neutral};
  border-bottom: 2.5px solid ${neutral};
  transform: rotate(45deg);
  margin-bottom: 4px;
  transition: border-color 0.15s ease;
}

button[aria-label="Bury"]:hover::before {
  border-color: ${downvote};
  ${glowDown}
}

/* Downvote chevron - voted */
button[aria-label="Remove bury"]::before {
  content: '';
  display: inline-block;
  width: 10px;
  height: 10px;
  border-right: 2.5px solid ${downvote};
  border-bottom: 2.5px solid ${downvote};
  transform: rotate(45deg);
  margin-bottom: 4px;
  ${glowDown}
}

/* Comment chevrons */
button[aria-label="Digg this comment"]::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  border-left: 2px solid ${neutral};
  border-top: 2px solid ${neutral};
  transform: rotate(45deg);
  margin-top: 3px;
  transition: border-color 0.15s ease;
}

button[aria-label="Digg this comment"]:hover::before {
  border-color: ${upvote};
}

button[aria-label="Remove comment digg"]::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  border-left: 2px solid ${upvote};
  border-top: 2px solid ${upvote};
  transform: rotate(45deg);
  margin-top: 3px;
}`;
}

/**
 * Generate full custom CSS from palette string
 * @param {string} paletteStr - The palette string
 * @returns {string} Complete CSS for custom theme
 */
function generateCustomCSS(paletteStr) {
  const { upvote, downvote, neutral, upvoteBg, downvoteBg, neutralBg, effects } = parseCustomPalette(paletteStr);
  const { hasGlow, hasBold, hasOutline, hasClassic, hasDark, hasChevron } = getEffectFlags(effects);
  const modeColors = getModeColors(hasDark);

  const glowUp = generateGlowCSS(upvote, hasGlow);
  const glowDown = generateGlowCSS(downvote, hasGlow);
  const glowNeutralUp = generateGlowCSS(upvote, hasGlow, true);
  const glowNeutralDown = generateGlowCSS(downvote, hasGlow, true);
  const scale = hasBold ? 'transform: scale(1.2);' : '';
  const outlineUp = generateOutlineCSS(upvote, hasOutline);
  const outlineDown = generateOutlineCSS(downvote, hasOutline);
  const classicLayout = hasClassic ? generateClassicLayoutCSS(modeColors) : '';
  const chevronStyle = hasChevron ? generateChevronCSS(upvote, downvote, neutral, hasGlow) : '';

  // Background colors - only used if explicitly provided or in classic mode
  const hasCustomBg = upvoteBg || downvoteBg || neutralBg;
  const upBg = upvoteBg || (hasClassic ? upvote : null);
  const downBg = downvoteBg || (hasClassic ? downvote : null);
  const neutralBgColor = neutralBg || (hasClassic ? neutral : null);

  // Background CSS - only apply if we have backgrounds
  const upBgStyle = upBg ? `background: linear-gradient(180deg, ${upBg}cc 0%, ${upBg} 100%) !important;` : '';
  const upBgHoverStyle = upBg
    ? `background: linear-gradient(180deg, ${upBg} 0%, ${upBg}dd 100%) !important;`
    : `background: ${upvote}15 !important;`;
  const upBgVotedStyle = upBg
    ? `background: linear-gradient(180deg, ${upBg}cc 0%, ${upBg} 100%) !important;`
    : `background: ${upvote}20 !important;`;

  const downBgStyle = downBg ? `background: linear-gradient(180deg, ${downBg}cc 0%, ${downBg} 100%) !important;` : '';
  const downBgHoverStyle = downBg
    ? `background: linear-gradient(180deg, ${downBg} 0%, ${downBg}dd 100%) !important;`
    : `background: ${downvote}15 !important;`;
  const downBgVotedStyle = downBg
    ? `background: linear-gradient(180deg, ${downBg}cc 0%, ${downBg} 100%) !important;`
    : `background: ${downvote}20 !important;`;

  const neutralBgStyle = neutralBgColor ? `background: linear-gradient(180deg, ${neutralBgColor}cc 0%, ${neutralBgColor} 100%) !important;` : '';

  return `
/* Digg Button Classic - Custom Theme */
/* Palette: ${paletteStr} */
${classicLayout}
${chevronStyle}

/* Force arrow colors by setting color on SVG element */
button[aria-label="Digg this post"] svg,
button[aria-label="Bury"] svg {
  color: ${neutral} !important;
}

button[aria-label="Digg this post"]:hover svg {
  color: ${upvote} !important;
}

button[aria-label="Bury"]:hover svg {
  color: ${downvote} !important;
}

button[aria-label="Remove digg"] svg {
  color: ${upvote} !important;
  ${scale}
  ${glowUp}
}

button[aria-label="Remove bury"] svg {
  color: ${downvote} !important;
  ${scale}
  ${glowDown}
}

/* Upvote button - unvoted state */
button[aria-label="Digg this post"] {
  transition: all 0.15s ease !important;
  ${upBgStyle}
  ${hasClassic ? '' : `border-radius: 4px !important;`}
}

button[aria-label="Digg this post"]:hover {
  ${upBgHoverStyle}
  ${hasClassic ? '' : `border-radius: 4px !important;`}
}

button[aria-label="Digg this post"]:hover svg {
  ${glowNeutralUp}
}

/* Upvote button - voted state */
button[aria-label="Remove digg"] {
  transition: all 0.15s ease !important;
  ${upBgVotedStyle}
  ${outlineUp}
  ${hasClassic ? '' : `border-radius: 4px !important;`}
}

button[aria-label="Remove digg"]:hover {
  ${upBg ? `background: linear-gradient(180deg, ${upBg} 0%, ${upBg}dd 100%) !important;` : `background: ${upvote}30 !important;`}
  ${hasClassic ? '' : `border-radius: 4px !important;`}
}

/* Downvote/Bury button - unvoted state */
button[aria-label="Bury"] {
  transition: all 0.15s ease !important;
  ${neutralBgStyle}
  ${hasClassic ? '' : `border-radius: 4px !important;`}
}

button[aria-label="Bury"]:hover {
  ${downBgHoverStyle}
  ${hasClassic ? '' : `border-radius: 4px !important;`}
}


button[aria-label="Bury"]:hover svg {
  ${glowNeutralDown}
}

/* Downvote/Bury button - voted state */
button[aria-label="Remove bury"] {
  transition: all 0.15s ease !important;
  ${downBgVotedStyle}
  ${outlineDown}
  ${hasClassic ? '' : `border-radius: 4px !important;`}
}

button[aria-label="Remove bury"]:hover {
  ${downBg ? `background: linear-gradient(180deg, ${downBg} 0%, ${downBg}dd 100%) !important;` : `background: ${downvote}30 !important;`}
  ${hasClassic ? '' : `border-radius: 4px !important;`}
}

/* Vote count styling when voted */
button[aria-label="Remove digg"] ~ span[aria-label$="diggs"],
button[aria-label="Remove digg"] + span[aria-label$="diggs"] {
  color: ${upvote} !important;
  ${hasGlow ? `text-shadow: 0 0 8px ${upvote};` : ''}
}

button[aria-label="Remove bury"] ~ span[aria-label$="diggs"],
button[aria-label="Remove bury"] + span[aria-label$="diggs"] {
  color: ${downvote} !important;
  ${hasGlow ? `text-shadow: 0 0 8px ${downvote};` : ''}
}

/* Comment vote buttons */
button[aria-label="Digg this comment"] svg {
  color: ${neutral} !important;
}

button[aria-label="Digg this comment"]:hover svg {
  color: ${upvote} !important;
}

button[aria-label="Digg this comment"]:hover {
  background: ${upvote}15 !important;
  border-radius: 4px !important;
}

button[aria-label="Remove comment digg"] svg {
  color: ${upvote} !important;
  ${glowUp}
}

button[aria-label="Remove comment digg"]:hover {
  background: ${upvote}25 !important;
  border-radius: 4px !important;
}`;
}

// Export for Node.js (testing) or make available globally (browser)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseCustomPalette,
    isValidHexColor,
    getEffectFlags,
    getModeColors,
    generateGlowCSS,
    generateOutlineCSS,
    generateDarkModeOverlay,
    generateClassicLayoutCSS,
    generateChevronCSS,
    generateCustomCSS
  };
}
