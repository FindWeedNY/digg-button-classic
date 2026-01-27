// Digg Button Classic - Popup Script

// Browser API compatibility (Firefox uses 'browser', Chrome uses 'chrome')
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const DEFAULT_THEME = 'classic';
const DEFAULT_PALETTE = '#ff6f00,#7193ff,#878a8c';

let globalDarkMode = false;
let debounceTimer = null;

// Color Picker
const colorPicker = {
  popup: null,
  canvas: null,
  ctx: null,
  svCursor: null,
  hueCursor: null,
  preview: null,
  hexInput: null,
  currentHue: 0,
  currentSat: 1,
  currentVal: 1,
  targetSwatch: null,
  targetHexInput: null,
  isDraggingSV: false,
  isDraggingHue: false,

  init() {
    this.popup = document.getElementById('colorPickerPopup');
    this.canvas = this.popup.querySelector('.cp-sv-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.svCursor = this.popup.querySelector('.cp-sv-cursor');
    this.hueCursor = this.popup.querySelector('.cp-hue-cursor');
    this.preview = this.popup.querySelector('.cp-preview');
    this.hexInput = this.popup.querySelector('.cp-hex-input');

    // SV canvas events
    this.canvas.addEventListener('mousedown', (e) => this.startSVDrag(e));
    document.addEventListener('mousemove', (e) => this.onSVDrag(e));
    document.addEventListener('mouseup', () => (this.isDraggingSV = false));

    // Hue bar events
    const hueWrapper = this.popup.querySelector('.cp-hue-wrapper');
    hueWrapper.addEventListener('mousedown', (e) => this.startHueDrag(e));
    document.addEventListener('mousemove', (e) => this.onHueDrag(e));
    document.addEventListener('mouseup', () => (this.isDraggingHue = false));

    // Hex input
    this.hexInput.addEventListener('input', () => this.onHexInput());

    // Close on outside click
    document.addEventListener('mousedown', (e) => {
      if (this.popup.classList.contains('visible') && !this.popup.contains(e.target) && !e.target.closest('.swatch')) {
        this.close();
      }
    });
  },

  open(swatch, hexInput) {
    this.targetSwatch = swatch;
    this.targetHexInput = hexInput;

    // Get current color from hex input or swatch
    let color = hexInput?.value || '#878a8c';
    if (!color.startsWith('#')) color = '#' + color;
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) color = '#878a8c';

    // Convert to HSV
    const rgb = this.hexToRgb(color);
    const hsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b);
    this.currentHue = hsv.h;
    this.currentSat = hsv.s;
    this.currentVal = hsv.v;

    // Position popup near swatch
    const rect = swatch.getBoundingClientRect();
    const popupWidth = 180;
    let left = rect.left;
    if (left + popupWidth > window.innerWidth - 10) {
      left = window.innerWidth - popupWidth - 10;
    }
    this.popup.style.left = Math.max(10, left) + 'px';
    this.popup.style.top = rect.bottom + 4 + 'px';

    this.popup.classList.add('visible');
    this.drawSV();
    this.updateCursors();
    this.updatePreview();
  },

  close() {
    this.popup.classList.remove('visible');
    this.targetSwatch = null;
    this.targetHexInput = null;
  },

  drawSV() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const hueColor = this.hsvToRgb(this.currentHue, 1, 1);

    // Create gradients
    const whiteGrad = this.ctx.createLinearGradient(0, 0, w, 0);
    whiteGrad.addColorStop(0, 'white');
    whiteGrad.addColorStop(1, `rgb(${hueColor.r},${hueColor.g},${hueColor.b})`);

    const blackGrad = this.ctx.createLinearGradient(0, 0, 0, h);
    blackGrad.addColorStop(0, 'transparent');
    blackGrad.addColorStop(1, 'black');

    this.ctx.fillStyle = whiteGrad;
    this.ctx.fillRect(0, 0, w, h);
    this.ctx.fillStyle = blackGrad;
    this.ctx.fillRect(0, 0, w, h);
  },

  updateCursors() {
    // SV cursor
    const svX = this.currentSat * this.canvas.width;
    const svY = (1 - this.currentVal) * this.canvas.height;
    this.svCursor.style.left = svX + 'px';
    this.svCursor.style.top = svY + 'px';

    // Hue cursor
    const hueX = (this.currentHue / 360) * this.popup.querySelector('.cp-hue-wrapper').offsetWidth;
    this.hueCursor.style.left = hueX + 'px';
  },

  updatePreview() {
    const rgb = this.hsvToRgb(this.currentHue, this.currentSat, this.currentVal);
    const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);
    this.preview.style.background = hex;
    this.hexInput.value = hex;
    this.applyColor(hex);
  },

  applyColor(hex) {
    if (!this.targetSwatch || !this.targetHexInput) return;

    // Update hex input
    this.targetHexInput.value = hex;

    // Update swatch
    const isBg = this.targetSwatch.classList.contains('bg-swatch');
    if (isBg) {
      this.targetSwatch.style.background = hex;
      this.targetSwatch.classList.remove('empty');
      const label = this.targetSwatch.querySelector('.bg-label');
      if (label) label.textContent = '';
    } else {
      const svg = this.targetSwatch.querySelector('svg');
      if (svg) {
        const isDown = this.targetSwatch.id === 'swatchDown';
        svg.setAttribute('style', `color: ${hex};${isDown ? ' transform: rotate(180deg);' : ''}`);
      }
    }

    updatePaletteFromColorPickers();
    applyCustomTheme();
  },

  startSVDrag(e) {
    this.isDraggingSV = true;
    this.onSVDrag(e);
  },

  onSVDrag(e) {
    if (!this.isDraggingSV) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    this.currentSat = x;
    this.currentVal = 1 - y;
    this.updateCursors();
    this.updatePreview();
  },

  startHueDrag(e) {
    this.isDraggingHue = true;
    this.onHueDrag(e);
  },

  onHueDrag(e) {
    if (!this.isDraggingHue) return;
    const rect = this.popup.querySelector('.cp-hue-wrapper').getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    this.currentHue = x * 360;
    this.drawSV();
    this.updateCursors();
    this.updatePreview();
  },

  onHexInput() {
    let value = this.hexInput.value.trim();
    if (!value.startsWith('#')) value = '#' + value;
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      const rgb = this.hexToRgb(value);
      const hsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b);
      this.currentHue = hsv.h;
      this.currentSat = hsv.s;
      this.currentVal = hsv.v;
      this.drawSV();
      this.updateCursors();
      this.preview.style.background = value;
      this.applyColor(value);
    }
  },

  // Color conversion utilities
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : { r: 135, g: 138, b: 140 };
  },

  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
  },

  rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    if (max !== min) {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h *= 60;
    }
    return { h, s, v };
  },

  hsvToRgb(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0,
      g = 0,
      b = 0;
    if (h < 60) {
      r = c;
      g = x;
    } else if (h < 120) {
      r = x;
      g = c;
    } else if (h < 180) {
      g = c;
      b = x;
    } else if (h < 240) {
      g = x;
      b = c;
    } else if (h < 300) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }
    return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
  },
};

async function init() {
  // Initialize color picker
  colorPicker.init();

  // Load saved theme, custom palette, dark mode, and collapse setting
  const result = await browserAPI.storage.local.get(['theme', 'customPalette', 'darkMode', 'collapseComments']);
  let theme = result.theme || DEFAULT_THEME;
  const customPalette = result.customPalette || DEFAULT_PALETTE;
  globalDarkMode = result.darkMode || false;

  // Migrate removed themes to classic
  if (theme === 'light' || theme === 'dark') {
    theme = 'classic';
    await browserAPI.storage.local.set({ theme });
  }

  // Update UI
  selectTheme(theme);
  loadCustomPalette(customPalette);
  updateDarkModeToggle();

  // Set collapse comments checkbox state
  document.getElementById('collapseComments').checked = result.collapseComments || false;

  // Check if on Digg
  checkDiggStatus();

  // Setup swatch click handlers to open color picker
  document.querySelectorAll('.swatch').forEach((swatch) => {
    swatch.addEventListener('click', (e) => {
      if (e.target.classList.contains('color-picker-input')) return;
      const colorItem = swatch.closest('.color-inputs');
      // Find the corresponding hex input
      const isBg = swatch.classList.contains('bg-swatch');
      const hexInput = isBg
        ? colorItem.querySelector('.hex-input[placeholder="auto"]')
        : colorItem.querySelector('.hex-input:not([placeholder])');
      colorPicker.open(swatch, hexInput);
    });
  });

  // Setup collapse comments toggle
  document.getElementById('collapseComments').addEventListener('change', async (e) => {
    const collapseComments = e.target.checked;
    await browserAPI.storage.local.set({ collapseComments });
    notifyCollapseChange(collapseComments);
  });

  // Setup dark mode toggle
  document.getElementById('darkModeToggle').addEventListener('click', async () => {
    globalDarkMode = !globalDarkMode;
    await browserAPI.storage.local.set({ darkMode: globalDarkMode });
    updateDarkModeToggle();

    // Re-apply current theme with new dark mode setting
    const currentResult = await browserAPI.storage.local.get(['theme', 'customPalette']);
    const currentTheme = currentResult.theme || DEFAULT_THEME;
    if (currentTheme === 'custom') {
      const palette = buildPaletteString();
      await saveCustomPalette(palette);
      notifyContentScript(currentTheme, palette, globalDarkMode);
    } else {
      notifyContentScript(currentTheme, null, globalDarkMode);
    }
  });

  // Setup theme click handlers
  document.querySelectorAll('.theme-option').forEach((option) => {
    option.addEventListener('click', async () => {
      const newTheme = option.dataset.theme;
      await saveTheme(newTheme);
      selectTheme(newTheme);

      if (newTheme === 'custom') {
        const palette = buildPaletteString();
        await saveCustomPalette(palette);
        notifyContentScript(newTheme, palette, globalDarkMode);
      } else {
        notifyContentScript(newTheme, null, globalDarkMode);
      }
    });
  });

  // Setup preset buttons - apply immediately, using light/dark palette based on mode
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const palette = globalDarkMode ? btn.dataset.paletteDark : btn.dataset.paletteLight;
      loadCustomPalette(palette);
      applyCustomTheme();
    });
  });

  // Setup effect checkboxes and layout/style radios - apply immediately
  document.querySelectorAll('.option-toggle input').forEach((input) => {
    input.addEventListener('change', () => {
      updatePaletteFromEffects();
      applyCustomTheme();
    });
  });

  // Setup palette input - apply with debounce for real-time preview
  const paletteInput = document.getElementById('paletteInput');
  paletteInput.addEventListener('input', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      updateColorSwatches();
      applyCustomTheme();
    }, 150);
  });

  // Double-click on background swatch to reset to "auto"
  document.querySelectorAll('.bg-swatch').forEach((swatch) => {
    swatch.addEventListener('dblclick', () => {
      swatch.classList.add('empty');
      swatch.style.background = '';
      const label = swatch.querySelector('.bg-label');
      if (label) label.textContent = 'auto';
      // Also clear hex input
      const hexInput = swatch.closest('.color-inputs')?.querySelector('.hex-input[placeholder="auto"]');
      if (hexInput) hexInput.value = '';
      updatePaletteFromColorPickers();
      applyCustomTheme();
    });
  });

  // Setup hex input handlers - these work without the popup closing
  document.querySelectorAll('.hex-input').forEach((input) => {
    input.addEventListener('input', () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        handleHexInputChange(input);
      }, 150);
    });

    // Also handle blur to clean up incomplete values
    input.addEventListener('blur', () => {
      handleHexInputChange(input);
    });
  });
}

// Handle hex input changes
function handleHexInputChange(input) {
  let value = input.value.trim();

  // Normalize hex value
  if (value && !value.startsWith('#')) {
    value = '#' + value;
  }

  // Validate hex color (3 or 6 digit)
  const isValidHex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);
  const inputId = input.id;

  // Map hex input IDs to color picker IDs
  const hexToPickerMap = {
    hexUp: 'colorUp',
    hexDown: 'colorDown',
    hexNeutral: 'colorNeutral',
    hexUpBg: 'colorUpBg',
    hexDownBg: 'colorDownBg',
    hexNeutralBg: 'colorNeutralBg',
  };

  const pickerId = hexToPickerMap[inputId];
  if (!pickerId) return;

  const picker = document.getElementById(pickerId);
  const isBg = inputId.includes('Bg');

  if (isBg) {
    // Handle background color inputs
    const swatchId = 'swatch' + inputId.replace('hex', '');
    const swatch = document.getElementById(swatchId);
    const label = swatch?.querySelector('.bg-label');

    if (!value || value === '#') {
      // Empty = auto
      if (swatch) {
        swatch.classList.add('empty');
        swatch.style.background = '';
      }
      if (label) label.textContent = 'auto';
      input.value = '';
    } else if (isValidHex) {
      // Expand 3-digit to 6-digit for color picker
      if (value.length === 4) {
        value = '#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3];
      }
      picker.value = value;
      input.value = value;
      if (swatch) {
        swatch.classList.remove('empty');
        swatch.style.background = value;
      }
      if (label) label.textContent = '';
    }
  } else {
    // Handle arrow color inputs
    if (isValidHex) {
      // Expand 3-digit to 6-digit for color picker
      if (value.length === 4) {
        value = '#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3];
      }
      picker.value = value;
      input.value = value;

      // Update swatch SVG color
      const swatchId = 'swatch' + inputId.replace('hex', '');
      const swatch = document.getElementById(swatchId);
      const svg = swatch?.querySelector('svg');
      if (svg) {
        const transform = inputId === 'hexDown' ? ' transform: rotate(180deg);' : '';
        svg.setAttribute('style', `color: ${value};${transform}`);
      }
    }
  }

  updatePaletteFromColorPickers();
  applyCustomTheme();
}

function selectTheme(theme) {
  // Update radio buttons
  document.querySelectorAll('.theme-option').forEach((option) => {
    const isSelected = option.dataset.theme === theme;
    option.classList.toggle('selected', isSelected);
    option.querySelector('input').checked = isSelected;
  });

  // Show/hide custom section
  const customSection = document.getElementById('customSection');
  customSection.classList.toggle('visible', theme === 'custom');
}

function loadCustomPalette(palette) {
  const input = document.getElementById('paletteInput');
  input.value = palette;

  // Parse effects from palette
  const [, effectPart] = palette.split(';');
  const effects = effectPart ? effectPart.split(',').map((e) => e.trim().toLowerCase()) : [];

  document.getElementById('effectGlow').checked = effects.includes('glow');
  document.getElementById('effectBold').checked = effects.includes('bold');
  document.getElementById('effectOutline').checked = effects.includes('outline');
  document.getElementById('layoutClassic').checked = effects.includes('classic');
  document.getElementById('layoutMinimal').checked = !effects.includes('classic');
  document.getElementById('styleChevron').checked = effects.includes('chevron');
  document.getElementById('styleDefault').checked = !effects.includes('chevron');

  // Update visual elements
  updateColorSwatches();
}

function updateColorSwatches() {
  const input = document.getElementById('paletteInput');
  const [colorPart] = input.value.split(';');
  const colors = colorPart.split(',').map((c) => c.trim());

  const upvote = colors[0] || '#ff6f00';
  const downvote = colors[1] || '#7193ff';
  const neutral = colors[2] || '#878a8c';
  const upvoteBg = colors[3] || null;
  const downvoteBg = colors[4] || null;
  const neutralBg = colors[5] || null;

  // Arrow color swatches - set SVG color via inline style
  const swatchUpSvg = document.querySelector('#swatchUp svg');
  const swatchDownSvg = document.querySelector('#swatchDown svg');
  const swatchNeutralSvg = document.querySelector('#swatchNeutral svg');

  if (swatchUpSvg) swatchUpSvg.setAttribute('style', `color: ${upvote};`);
  if (swatchDownSvg) swatchDownSvg.setAttribute('style', `color: ${downvote}; transform: rotate(180deg);`);
  if (swatchNeutralSvg) swatchNeutralSvg.setAttribute('style', `color: ${neutral};`);

  // Update color picker inputs
  document.getElementById('colorUp').value = upvote;
  document.getElementById('colorDown').value = downvote;
  document.getElementById('colorNeutral').value = neutral;
  if (upvoteBg) document.getElementById('colorUpBg').value = upvoteBg;
  if (downvoteBg) document.getElementById('colorDownBg').value = downvoteBg;
  if (neutralBg) document.getElementById('colorNeutralBg').value = neutralBg;

  // Update hex inputs
  document.getElementById('hexUp').value = upvote;
  document.getElementById('hexDown').value = downvote;
  document.getElementById('hexNeutral').value = neutral;
  document.getElementById('hexUpBg').value = upvoteBg && upvoteBg.startsWith('#') ? upvoteBg : '';
  document.getElementById('hexDownBg').value = downvoteBg && downvoteBg.startsWith('#') ? downvoteBg : '';
  document.getElementById('hexNeutralBg').value = neutralBg && neutralBg.startsWith('#') ? neutralBg : '';

  // Set background colors on swatches
  const swatchUp = document.getElementById('swatchUp');
  const swatchDown = document.getElementById('swatchDown');
  const swatchNeutral = document.getElementById('swatchNeutral');

  swatchUp.style.background = upvoteBg || '#27272a';
  swatchDown.style.background = downvoteBg || '#27272a';
  swatchNeutral.style.background = neutralBg || '#27272a';

  // Background color swatches
  const swatchUpBg = document.getElementById('swatchUpBg');
  const swatchDownBg = document.getElementById('swatchDownBg');
  const swatchNeutralBg = document.getElementById('swatchNeutralBg');

  const upBgLabel = swatchUpBg?.querySelector('.bg-label');
  const downBgLabel = swatchDownBg?.querySelector('.bg-label');
  const neutralBgLabel = swatchNeutralBg?.querySelector('.bg-label');

  if (swatchUpBg) {
    if (upvoteBg && upvoteBg.startsWith('#')) {
      swatchUpBg.style.background = upvoteBg;
      if (upBgLabel) upBgLabel.textContent = '';
      swatchUpBg.classList.remove('empty');
    } else {
      swatchUpBg.style.background = '';
      if (upBgLabel) upBgLabel.textContent = 'auto';
      swatchUpBg.classList.add('empty');
    }
  }

  if (swatchDownBg) {
    if (downvoteBg && downvoteBg.startsWith('#')) {
      swatchDownBg.style.background = downvoteBg;
      if (downBgLabel) downBgLabel.textContent = '';
      swatchDownBg.classList.remove('empty');
    } else {
      swatchDownBg.style.background = '';
      if (downBgLabel) downBgLabel.textContent = 'auto';
      swatchDownBg.classList.add('empty');
    }
  }

  if (swatchNeutralBg) {
    if (neutralBg && neutralBg.startsWith('#')) {
      swatchNeutralBg.style.background = neutralBg;
      if (neutralBgLabel) neutralBgLabel.textContent = '';
      swatchNeutralBg.classList.remove('empty');
    } else {
      swatchNeutralBg.style.background = '';
      if (neutralBgLabel) neutralBgLabel.textContent = 'auto';
      swatchNeutralBg.classList.add('empty');
    }
  }
}

function buildPaletteString() {
  const input = document.getElementById('paletteInput');
  let [colorPart] = input.value.split(';');

  const effects = [];
  if (document.getElementById('layoutClassic').checked) effects.push('classic');
  if (document.getElementById('styleChevron').checked) effects.push('chevron');
  if (globalDarkMode) effects.push('dark');
  if (document.getElementById('effectGlow').checked) effects.push('glow');
  if (document.getElementById('effectBold').checked) effects.push('bold');
  if (document.getElementById('effectOutline').checked) effects.push('outline');

  return effects.length > 0 ? `${colorPart};${effects.join(',')}` : colorPart;
}

function updatePaletteFromColorPickers() {
  const upvote = document.getElementById('hexUp').value || '#ff6f00';
  const downvote = document.getElementById('hexDown').value || '#7193ff';
  const neutral = document.getElementById('hexNeutral').value || '#878a8c';
  const upvoteBg = document.getElementById('hexUpBg').value;
  const downvoteBg = document.getElementById('hexDownBg').value;
  const neutralBg = document.getElementById('hexNeutralBg').value;

  // Get current effects
  const input = document.getElementById('paletteInput');
  const [, effectPart] = input.value.split(';');

  // Check if backgrounds are set (not default)
  const swatchUpBg = document.getElementById('swatchUpBg');
  const swatchDownBg = document.getElementById('swatchDownBg');
  const swatchNeutralBg = document.getElementById('swatchNeutralBg');

  let colorPart = `${upvote},${downvote},${neutral}`;

  // Add backgrounds if any are set
  const hasUpBg = !swatchUpBg.classList.contains('empty');
  const hasDownBg = !swatchDownBg.classList.contains('empty');
  const hasNeutralBg = !swatchNeutralBg.classList.contains('empty');

  if (hasUpBg || hasDownBg || hasNeutralBg) {
    colorPart += `,${hasUpBg ? upvoteBg : ''},${hasDownBg ? downvoteBg : ''},${hasNeutralBg ? neutralBg : ''}`;
  }

  input.value = effectPart ? `${colorPart};${effectPart}` : colorPart;
}

function updatePaletteFromEffects() {
  const palette = buildPaletteString();
  document.getElementById('paletteInput').value = palette;
}

async function applyCustomTheme() {
  const palette = buildPaletteString();
  await saveTheme('custom');
  await saveCustomPalette(palette);
  selectTheme('custom');
  notifyContentScript('custom', palette, globalDarkMode);
}

function updateDarkModeToggle() {
  const toggle = document.getElementById('darkModeToggle');
  const lightLabel = document.getElementById('lightLabel');
  const darkLabel = document.getElementById('darkLabel');

  toggle.classList.toggle('dark', globalDarkMode);
  lightLabel.classList.toggle('active', !globalDarkMode);
  darkLabel.classList.toggle('active', globalDarkMode);
}

async function saveTheme(theme) {
  await browserAPI.storage.local.set({ theme });
}

async function saveCustomPalette(palette) {
  await browserAPI.storage.local.set({ customPalette: palette });
}

async function notifyContentScript(theme, customPalette, darkMode) {
  try {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.url?.includes('digg.com')) {
      await browserAPI.tabs.sendMessage(tabs[0].id, { type: 'themeChanged', theme, customPalette, darkMode });
    }
  } catch (e) {
    // Content script might not be loaded
    console.log('Could not notify content script:', e);
  }
}

async function notifyCollapseChange(collapseComments) {
  try {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.url?.includes('digg.com')) {
      await browserAPI.tabs.sendMessage(tabs[0].id, { type: 'collapseChanged', collapseComments });
    }
  } catch (e) {
    // Content script might not be loaded
    console.log('Could not notify content script:', e);
  }
}

async function checkDiggStatus() {
  const statusEl = document.getElementById('status');
  try {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.url?.includes('digg.com')) {
      statusEl.textContent = 'Active on this page';
      statusEl.className = 'status active';
    } else {
      statusEl.textContent = 'Visit digg.com to see styled buttons';
      statusEl.className = 'status inactive';
    }
  } catch (e) {
    statusEl.textContent = 'Unknown status';
    statusEl.className = 'status';
  }
}

// Initialize
init();
