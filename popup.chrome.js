// Digg Button Classic - Popup Script (Chrome)

const DEFAULT_THEME = 'classic';

async function init() {
  // Load saved theme
  const result = await chrome.storage.local.get('theme');
  const theme = result.theme || DEFAULT_THEME;

  // Update UI
  selectTheme(theme);

  // Check if on Digg
  checkDiggStatus();

  // Setup click handlers
  document.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', async () => {
      const newTheme = option.dataset.theme;
      await saveTheme(newTheme);
      selectTheme(newTheme);
      notifyContentScript(newTheme);
    });
  });
}

function selectTheme(theme) {
  // Update radio buttons
  document.querySelectorAll('.theme-option').forEach(option => {
    const isSelected = option.dataset.theme === theme;
    option.classList.toggle('selected', isSelected);
    option.querySelector('input').checked = isSelected;
  });
}

async function saveTheme(theme) {
  await chrome.storage.local.set({ theme });
}

async function notifyContentScript(theme) {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.url?.includes('digg.com')) {
      await chrome.tabs.sendMessage(tabs[0].id, { type: 'themeChanged', theme });
    }
  } catch (e) {
    // Content script might not be loaded
    console.log('Could not notify content script:', e);
  }
}

async function checkDiggStatus() {
  const statusEl = document.getElementById('status');
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
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
