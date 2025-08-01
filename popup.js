import { toggleClickMode } from './dom.js';

let isClickModeActive = false;

function updateClickModeButton() {
  const button = document.getElementById('toggleClickMode');
  button.textContent = isClickModeActive ? '🔍 Click Mode: ON' : '🔍 Click Mode: OFF';
  
  if (isClickModeActive) {
    button.style.backgroundColor = '#dcfce7';
    button.style.borderColor = '#22c55e';
    button.style.color = '#166534';
  } else {
    button.style.backgroundColor = '#dbeafe';
    button.style.borderColor = '#93c5fd';
    button.style.color = '#1e40af';
  }
}

async function handleToggleClickMode() {
  const output = document.getElementById('output');
  output.innerHTML = "Toggling click mode...";
  
  try {
    isClickModeActive = !isClickModeActive;
    await toggleClickMode(isClickModeActive);
    updateClickModeButton();
    
    if (isClickModeActive) {
      output.innerHTML = "🔍 <b>Click Mode Active!</b><br>Click on any element to get its XPath.";
    } else {
      output.innerHTML = "Enable <b>Click Mode</b> to get XPath for specific elements.";
    }
  } catch (err) {
    console.error('Toggle error:', err);
    output.innerHTML = `❌ Error: ${err.message}<br><br>Try refreshing the page and try again.`;
    isClickModeActive = !isClickModeActive;
    updateClickModeButton();
  }
}

document.getElementById("toggleClickMode").addEventListener("click", handleToggleClickMode);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'clickModeDeactivated') {
    isClickModeActive = false;
    updateClickModeButton();
    document.getElementById('output').innerHTML = "Enable <b>Click Mode</b> to get XPath for specific elements.";
  }
});
