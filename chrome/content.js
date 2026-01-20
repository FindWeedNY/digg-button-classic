// Digg Button Classic - Content Script (Chrome)

const STYLE_ID = 'dbc-theme-style';
const DEFAULT_THEME = 'classic';

let currentTheme = null;

async function init() {
  // Load saved theme
  const result = await chrome.storage.local.get('theme');
  const theme = result.theme || DEFAULT_THEME;

  // Apply theme
  applyTheme(theme);

  // Listen for theme changes from popup
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'themeChanged') {
      applyTheme(message.theme);
    }
  });

  // Watch for storage changes (sync across tabs)
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.theme) {
      applyTheme(changes.theme.newValue);
    }
  });
}

async function applyTheme(theme) {
  if (theme === currentTheme) return;

  // Remove existing theme style
  const existingStyle = document.getElementById(STYLE_ID);
  if (existingStyle) {
    existingStyle.remove();
  }

  // Remove existing theme class
  document.body.classList.forEach(cls => {
    if (cls.startsWith('dbc-theme-')) {
      document.body.classList.remove(cls);
    }
  });

  // Add new theme class
  document.body.classList.add(`dbc-theme-${theme}`);

  // Load and inject theme CSS
  try {
    const cssUrl = chrome.runtime.getURL(`themes/${theme}.css`);
    const response = await fetch(cssUrl);
    const css = await response.text();

    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    currentTheme = theme;
    console.log(`[Digg Button Classic] Applied theme: ${theme}`);
  } catch (e) {
    console.error(`[Digg Button Classic] Failed to load theme: ${theme}`, e);
  }
}

// Initialize
init();
