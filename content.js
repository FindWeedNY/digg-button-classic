// Digg Button Classic - Content Script

// Browser API compatibility (Firefox uses 'browser', Chrome uses 'chrome')
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const STYLE_ID = 'dbc-theme-style';
const DEFAULT_THEME = 'classic';

let currentTheme = null;
let currentCustomPalette = null;
let currentDarkMode = null;
let svgObserver = null;

async function init() {
  // Load saved theme, custom palette, and dark mode
  const result = await browserAPI.storage.local.get(['theme', 'customPalette', 'darkMode']);
  let theme = result.theme || DEFAULT_THEME;

  // Migrate removed themes to classic
  if (theme === 'light' || theme === 'dark') {
    theme = 'classic';
    await browserAPI.storage.local.set({ theme });
  }

  // Apply theme
  applyTheme(theme, result.customPalette, result.darkMode || false);

  // Listen for theme changes from popup
  browserAPI.runtime.onMessage.addListener((message) => {
    if (message.type === 'themeChanged') {
      applyTheme(message.theme, message.customPalette, message.darkMode);
    }
  });

  // Watch for storage changes (sync across tabs)
  browserAPI.storage.onChanged.addListener((changes) => {
    if (changes.theme || changes.customPalette || changes.darkMode) {
      browserAPI.storage.local.get(['theme', 'customPalette', 'darkMode']).then((result) => {
        let theme = result.theme || DEFAULT_THEME;
        // Migrate removed themes to classic
        if (theme === 'light' || theme === 'dark') {
          theme = 'classic';
        }
        applyTheme(theme, result.customPalette, result.darkMode || false);
      });
    }
  });
}

async function applyTheme(theme, customPalette, darkMode = false) {
  // Check if anything changed
  const themeChanged = theme !== currentTheme;
  const paletteChanged = customPalette !== currentCustomPalette;
  const darkModeChanged = darkMode !== currentDarkMode;

  if (!themeChanged && !paletteChanged && !darkModeChanged) return;

  // Remove existing theme style
  const existingStyle = document.getElementById(STYLE_ID);
  if (existingStyle) {
    existingStyle.remove();
  }

  // Remove existing theme class
  document.body.classList.forEach((cls) => {
    if (cls.startsWith('dbc-theme-') || cls === 'dbc-dark') {
      document.body.classList.remove(cls);
    }
  });

  // Add new theme class
  document.body.classList.add(`dbc-theme-${theme}`);
  if (darkMode) {
    document.body.classList.add('dbc-dark');
  }

  let css;

  if (theme === 'custom' && customPalette) {
    // For custom themes, inject dark mode into palette if global dark mode is on
    let effectivePalette = customPalette;
    if (darkMode && !customPalette.includes('dark')) {
      effectivePalette = customPalette.includes(';') ? customPalette.replace(';', ';dark,') : customPalette + ';dark';
    }
    css = generateCustomCSS(effectivePalette);
    currentCustomPalette = customPalette;
  } else {
    // Load theme CSS from file
    try {
      const cssUrl = browserAPI.runtime.getURL(`themes/${theme}.css`);
      const response = await fetch(cssUrl);
      css = await response.text();
    } catch (e) {
      console.error(`[Digg Button Classic] Failed to load theme: ${theme}`, e);
      return;
    }
  }

  const styleEl = document.createElement('style');
  styleEl.id = STYLE_ID;
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // Dark mode is now handled by .dbc-dark class in each theme's CSS
  // No additional overlay needed - themes have their own dark mode styles

  // Apply inline styles to SVGs for custom themes
  if (theme === 'custom' && customPalette) {
    applySvgInlineStyles(customPalette);
    setupSvgObserver(customPalette);
    // Re-apply after a delay to catch lazily-loaded elements
    setTimeout(() => applySvgInlineStyles(customPalette), 500);
    setTimeout(() => applySvgInlineStyles(customPalette), 1500);
  } else {
    // Clean up observer if switching away from custom theme
    if (svgObserver) {
      svgObserver.disconnect();
      svgObserver = null;
    }
  }

  currentTheme = theme;
  currentDarkMode = darkMode;
  console.log(`[Digg Button Classic] Applied theme: ${theme}${darkMode ? ' (dark)' : ''}`);
}

// Parse custom palette string: "#upvote,#downvote,#neutral,#upBg,#downBg,#neutralBg;effect1,effect2"
function parseCustomPalette(paletteStr) {
  const [colorPart, effectPart] = paletteStr.split(';');
  const colors = colorPart.split(',').map((c) => c.trim());
  const effects = effectPart ? effectPart.split(',').map((e) => e.trim().toLowerCase()) : [];

  return {
    upvote: colors[0] || '#ff6f00',
    downvote: colors[1] || '#7193ff',
    neutral: colors[2] || '#878a8c',
    upvoteBg: colors[3] || null,
    downvoteBg: colors[4] || null,
    neutralBg: colors[5] || null,
    effects: effects,
  };
}

// Generate chevron arrow CSS
function generateChevronCSS(upvote, downvote, neutral, hasGlow) {
  const glowUp = hasGlow ? `filter: drop-shadow(0 0 3px ${upvote});` : '';
  const glowDown = hasGlow ? `filter: drop-shadow(0 0 3px ${downvote});` : '';

  return `
/* Chevron Arrow Style */
div[role="group"][aria-label="Vote on post"] button svg,
button[aria-label="Digg this comment"] svg,
button[aria-label="Remove comment digg"] svg {
  display: none !important;
}

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

// Generate CSS from custom palette
function generateCustomCSS(paletteStr) {
  const { upvote, downvote, neutral, upvoteBg, downvoteBg, neutralBg, effects } = parseCustomPalette(paletteStr);

  const hasOutline = effects.includes('outline');
  const hasClassic = effects.includes('classic');
  const hasDark = effects.includes('dark');
  const hasChevron = effects.includes('chevron');
  const hasGlow = effects.includes('glow');

  // Mode colors
  const containerBg = hasDark
    ? 'linear-gradient(180deg, #2d2d2d 0%, #1a1a1a 100%)'
    : 'linear-gradient(180deg, #f8f8f8 0%, #e5e5e5 100%)';
  const containerBorder = hasDark ? '#444' : '#a0a0a0';
  const countBg = hasDark
    ? 'linear-gradient(180deg, #333 0%, #222 100%)'
    : 'linear-gradient(180deg, #fff 0%, #f0f0f0 100%)';
  const countColor = hasDark ? '#e0e0e0' : '#1a1a1a';
  const countBorder = hasDark ? '#444' : '#ccc';

  // Button backgrounds - use custom backgrounds if set, otherwise transparent for inline layout
  const upBtnBg = hasClassic
    ? `linear-gradient(180deg, ${upvote}cc 0%, ${upvote} 100%)`
    : upvoteBg
      ? upvoteBg
      : 'transparent';
  const downBtnBg = hasClassic
    ? `linear-gradient(180deg, ${downvote}cc 0%, ${downvote} 100%)`
    : downvoteBg
      ? downvoteBg
      : 'transparent';
  const neutralBtnBg = hasClassic
    ? `linear-gradient(180deg, ${neutral}cc 0%, ${neutral} 100%)`
    : neutralBg
      ? neutralBg
      : 'transparent';

  // Outline effect
  const outlineUp = hasOutline ? `outline: 2px solid ${upvote}; outline-offset: 2px; border-radius: 4px;` : '';
  const outlineDown = hasOutline ? `outline: 2px solid ${downvote}; outline-offset: 2px; border-radius: 4px;` : '';

  // Classic layout CSS
  const classicLayout = hasClassic
    ? `
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
}
`
    : '';

  // Chevron style CSS
  const chevronStyle = hasChevron ? generateChevronCSS(upvote, downvote, neutral, hasGlow) : '';

  return `
/* Digg Button Classic - Custom Theme */
/* Palette: ${paletteStr} */
${classicLayout}
${chevronStyle}

/* Upvote button - unvoted state */
button[aria-label="Digg this post"]:not([aria-pressed="true"]) {
  transition: all 0.15s ease !important;
  background: ${neutralBtnBg} !important;
  ${hasClassic ? '' : 'border-radius: 4px !important;'}
}

button[aria-label="Digg this post"]:not([aria-pressed="true"]):hover {
  background: ${hasClassic ? `linear-gradient(180deg, ${upvote} 0%, ${upvote}dd 100%)` : `${upvote}15`} !important;
  ${hasClassic ? '' : 'border-radius: 4px !important;'}
}

button[aria-label="Digg this post"]:not([aria-pressed="true"]) svg,
button[aria-label="Digg this post"][aria-pressed="false"] svg {
  color: ${neutral} !important;
}

button[aria-label="Digg this post"]:not([aria-pressed="true"]) svg path,
button[aria-label="Digg this post"][aria-pressed="false"] svg path {
  fill: ${neutral} !important;
}

button[aria-label="Digg this post"]:not([aria-pressed="true"]):hover svg {
  color: ${upvote} !important;
}

button[aria-label="Digg this post"]:not([aria-pressed="true"]):hover svg path {
  fill: ${upvote} !important;
}

/* Upvote button - voted state (aria-pressed="true") */
body.dbc-theme-custom button[aria-label="Digg this post"][aria-pressed="true"] {
  transition: all 0.15s ease !important;
  background: ${upBtnBg} !important;
  ${hasClassic ? '' : 'border-radius: 4px !important;'}
  ${outlineUp}
}

body.dbc-theme-custom button[aria-label="Digg this post"][aria-pressed="true"] svg {
  color: ${upvote} !important;
}

body.dbc-theme-custom button[aria-label="Digg this post"][aria-pressed="true"] svg path {
  fill: ${upvote} !important;
}

body.dbc-theme-custom button[aria-label="Digg this post"][aria-pressed="true"]:hover {
  background: ${hasClassic ? `linear-gradient(180deg, ${upvote} 0%, ${upvote}dd 100%)` : `${upvote}25`} !important;
  ${hasClassic ? '' : 'border-radius: 4px !important;'}
}

/* Upvote button - voted state */
body.dbc-theme-custom div[role="group"][aria-label="Vote on post"] button[aria-label="Remove digg"] svg,
body.dbc-theme-custom button[aria-label="Remove digg"][aria-pressed="true"] svg,
body.dbc-theme-custom button[aria-label="Remove digg"] svg {
  color: ${upvote} !important;
}

body.dbc-theme-custom div[role="group"][aria-label="Vote on post"] button[aria-label="Remove digg"] svg path,
body.dbc-theme-custom button[aria-label="Remove digg"][aria-pressed="true"] svg path,
body.dbc-theme-custom button[aria-label="Remove digg"] svg path {
  fill: ${upvote} !important;
}

body.dbc-theme-custom button[aria-label="Remove digg"] {
  transition: all 0.15s ease !important;
  background: ${upBtnBg} !important;
  ${hasClassic ? '' : 'border-radius: 4px !important;'}
  ${outlineUp}
}

body.dbc-theme-custom button[aria-label="Remove digg"]:hover {
  background: ${hasClassic ? `linear-gradient(180deg, ${upvote} 0%, ${upvote}dd 100%)` : `${upvote}25`} !important;
  ${hasClassic ? '' : 'border-radius: 4px !important;'}
}

/* Downvote/Bury button - unvoted state */
button[aria-label="Bury"]:not([aria-pressed="true"]) {
  transition: all 0.15s ease !important;
  background: ${neutralBtnBg} !important;
  ${hasClassic ? '' : 'border-radius: 4px !important;'}
}

button[aria-label="Bury"]:not([aria-pressed="true"]):hover {
  background: ${hasClassic ? `linear-gradient(180deg, ${downvote}cc 0%, ${downvote} 100%)` : `${downvote}15`} !important;
  ${hasClassic ? '' : 'border-radius: 4px !important;'}
}

button[aria-label="Bury"]:not([aria-pressed="true"]) svg,
button[aria-label="Bury"][aria-pressed="false"] svg {
  color: ${neutral} !important;
}

button[aria-label="Bury"]:not([aria-pressed="true"]) svg path,
button[aria-label="Bury"][aria-pressed="false"] svg path {
  fill: ${neutral} !important;
}

button[aria-label="Bury"]:not([aria-pressed="true"]):hover svg {
  color: ${downvote} !important;
}

button[aria-label="Bury"]:not([aria-pressed="true"]):hover svg path {
  fill: ${downvote} !important;
}

/* Downvote/Bury button - voted state (aria-pressed="true") */
body.dbc-theme-custom button[aria-label="Bury"][aria-pressed="true"] {
  transition: all 0.15s ease !important;
  background: ${downBtnBg} !important;
  ${hasClassic ? '' : 'border-radius: 4px !important;'}
  ${outlineDown}
}

body.dbc-theme-custom button[aria-label="Bury"][aria-pressed="true"] svg {
  color: ${downvote} !important;
}

body.dbc-theme-custom button[aria-label="Bury"][aria-pressed="true"] svg path {
  fill: ${downvote} !important;
}

body.dbc-theme-custom button[aria-label="Bury"][aria-pressed="true"]:hover {
  background: ${hasClassic ? `linear-gradient(180deg, ${downvote} 0%, ${downvote}dd 100%)` : `${downvote}25`} !important;
  ${hasClassic ? '' : 'border-radius: 4px !important;'}
}

/* Downvote/Bury button - voted state */
body.dbc-theme-custom div[role="group"][aria-label="Vote on post"] button[aria-label="Remove bury"] svg,
body.dbc-theme-custom button[aria-label="Remove bury"][aria-pressed="true"] svg,
body.dbc-theme-custom button[aria-label="Remove bury"] svg {
  color: ${downvote} !important;
}

body.dbc-theme-custom div[role="group"][aria-label="Vote on post"] button[aria-label="Remove bury"] svg path,
body.dbc-theme-custom button[aria-label="Remove bury"][aria-pressed="true"] svg path,
body.dbc-theme-custom button[aria-label="Remove bury"] svg path {
  fill: ${downvote} !important;
}

body.dbc-theme-custom button[aria-label="Remove bury"] {
  transition: all 0.15s ease !important;
  background: ${downBtnBg} !important;
  ${hasClassic ? '' : 'border-radius: 4px !important;'}
  ${outlineDown}
}

body.dbc-theme-custom button[aria-label="Remove bury"] svg {
  color: ${downvote} !important;
}

body.dbc-theme-custom button[aria-label="Remove bury"] svg path {
  fill: ${downvote} !important;
}

button[aria-label="Remove bury"]:hover {
  background: ${hasClassic ? `linear-gradient(180deg, ${downvote} 0%, ${downvote}dd 100%)` : `${downvote}25`} !important;
  ${hasClassic ? '' : 'border-radius: 4px !important;'}
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
button[aria-label="Digg this comment"] {
  transition: all 0.15s ease !important;
}

button[aria-label="Digg this comment"]:hover {
  background: ${upvote}20 !important;
  border-radius: 4px !important;
}

button[aria-label="Digg this comment"][aria-pressed="false"] svg,
button[aria-label="Digg this comment"] svg {
  color: ${neutral} !important;
}

button[aria-label="Digg this comment"][aria-pressed="false"] svg path,
button[aria-label="Digg this comment"] svg path {
  fill: ${neutral} !important;
}

button[aria-label="Digg this comment"]:hover svg {
  color: ${upvote} !important;
}

button[aria-label="Digg this comment"]:hover svg path {
  fill: ${upvote} !important;
}

button[aria-label="Remove comment digg"][aria-pressed="true"] svg,
button[aria-label="Remove comment digg"] svg {
  color: ${upvote} !important;
}

button[aria-label="Remove comment digg"][aria-pressed="true"] svg path,
button[aria-label="Remove comment digg"] svg path {
  fill: ${upvote} !important;
}

button[aria-label="Remove comment digg"]:hover {
  background: ${upvote}30 !important;
  border-radius: 4px !important;
}
`;
}

// Apply inline styles to SVG elements for custom colors
function applySvgInlineStyles(palette) {
  if (!palette) return;

  const { upvote, downvote, neutral, effects } = parseCustomPalette(palette);
  const hasGlow = effects.includes('glow');
  const hasBold = effects.includes('bold');

  // Apply color to SVG and its path
  function styleSvg(svg, color, isVoted) {
    let style = `color: ${color} !important; fill: ${color} !important;`;
    if (isVoted && hasGlow) {
      style += ` filter: drop-shadow(0 0 4px ${color}) drop-shadow(0 0 8px ${color}) !important;`;
    }
    if (isVoted && hasBold) {
      style += ' transform: scale(1.2) !important;';
    }
    svg.setAttribute('style', style);

    // Set fill on path elements
    svg.querySelectorAll('path').forEach((path) => {
      path.setAttribute('style', `fill: ${color} !important;`);
    });
  }

  // Apply to upvote buttons - neutral when unvoted, upvote color when voted
  document.querySelectorAll('button[aria-label="Digg this post"]').forEach((button) => {
    const svg = button.querySelector('svg');
    if (!svg) return;
    const isVoted = button.getAttribute('aria-pressed') === 'true';
    styleSvg(svg, isVoted ? upvote : neutral, isVoted);
  });
  document.querySelectorAll('button[aria-label="Remove digg"] svg').forEach((svg) => {
    styleSvg(svg, upvote, true);
  });

  // Apply to downvote buttons - neutral when unvoted, downvote color when voted
  document.querySelectorAll('button[aria-label="Bury"]').forEach((button) => {
    const svg = button.querySelector('svg');
    if (!svg) return;
    const isVoted = button.getAttribute('aria-pressed') === 'true';
    styleSvg(svg, isVoted ? downvote : neutral, isVoted);
  });
  document.querySelectorAll('button[aria-label="Remove bury"] svg').forEach((svg) => {
    styleSvg(svg, downvote, true);
  });

  // Apply to comment buttons - neutral when unvoted, upvote color when voted
  document.querySelectorAll('button[aria-label="Digg this comment"] svg').forEach((svg) => {
    styleSvg(svg, neutral, false);
  });
  document.querySelectorAll('button[aria-label="Remove comment digg"] svg').forEach((svg) => {
    styleSvg(svg, upvote, true);
  });
}

// Set up observer to apply styles to dynamically loaded SVGs
function setupSvgObserver(palette) {
  // Clean up existing observer
  if (svgObserver) {
    svgObserver.disconnect();
    svgObserver = null;
  }

  if (!palette) return;

  const { upvote, downvote, neutral, effects } = parseCustomPalette(palette);
  const hasGlow = effects.includes('glow');
  const hasBold = effects.includes('bold');

  function styleSvg(svg, color, isVoted) {
    let style = `color: ${color} !important; fill: ${color} !important;`;
    if (isVoted && hasGlow) {
      style += ` filter: drop-shadow(0 0 4px ${color}) drop-shadow(0 0 8px ${color}) !important;`;
    }
    if (isVoted && hasBold) {
      style += ' transform: scale(1.2) !important;';
    }
    svg.setAttribute('style', style);

    // Set fill on path elements
    svg.querySelectorAll('path').forEach((path) => {
      path.setAttribute('style', `fill: ${color} !important;`);
    });
  }

  function styleButton(button) {
    const label = button.getAttribute('aria-label');
    const svg = button.querySelector('svg');
    if (!svg) return;

    const isPressed = button.getAttribute('aria-pressed') === 'true';

    // Unvoted = neutral color, voted = upvote/downvote color
    if (label === 'Digg this post') {
      // Can have aria-pressed="true" when voted
      styleSvg(svg, isPressed ? upvote : neutral, isPressed);
    } else if (label === 'Digg this comment') {
      styleSvg(svg, neutral, false);
    } else if (label === 'Remove digg' || label === 'Remove comment digg') {
      styleSvg(svg, upvote, true);
    } else if (label === 'Bury') {
      // Bury can have aria-pressed="true" when voted
      styleSvg(svg, isPressed ? downvote : neutral, isPressed);
    } else if (label === 'Remove bury') {
      styleSvg(svg, downvote, true);
    }
  }

  function styleSvgInButton(svg) {
    const button = svg.closest('button[aria-label]');
    if (!button) return;

    const label = button.getAttribute('aria-label');
    const isPressed = button.getAttribute('aria-pressed') === 'true';

    // Unvoted = neutral color, voted = upvote/downvote color
    if (label === 'Digg this post') {
      // Can have aria-pressed="true" when voted
      styleSvg(svg, isPressed ? upvote : neutral, isPressed);
    } else if (label === 'Digg this comment') {
      styleSvg(svg, neutral, false);
    } else if (label === 'Remove digg' || label === 'Remove comment digg') {
      styleSvg(svg, upvote, true);
    } else if (label === 'Bury') {
      // Bury can have aria-pressed="true" when voted
      styleSvg(svg, isPressed ? downvote : neutral, isPressed);
    } else if (label === 'Remove bury') {
      styleSvg(svg, downvote, true);
    }
  }

  svgObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Handle new nodes being added
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          // Check if the added node is an SVG inside a vote button
          if (node.tagName === 'svg' || node.tagName === 'SVG') {
            styleSvgInButton(node);
          }

          // Check if the added node contains SVGs
          if (node.querySelectorAll) {
            node.querySelectorAll('svg').forEach(styleSvgInButton);
          }

          // Check if the added node contains vote buttons
          if (node.querySelectorAll) {
            node.querySelectorAll('button[aria-label]').forEach(styleButton);
          }

          // Also check if the node itself is a button
          if (node.matches && node.matches('button[aria-label]')) {
            styleButton(node);
          }
        }
      }

      // Handle attribute changes (e.g., aria-label or aria-pressed changing when voting)
      if (
        mutation.type === 'attributes' &&
        (mutation.attributeName === 'aria-label' || mutation.attributeName === 'aria-pressed')
      ) {
        const target = mutation.target;
        if (target.matches && target.matches('button[aria-label]')) {
          styleButton(target);
        }
      }
    }
  });

  svgObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-label', 'aria-pressed'],
  });
}

// Initialize
init();
