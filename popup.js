import { toggleClickMode } from './dom.js';
import { callAIAPI } from './api.js';
import { isApiConfigured } from './config.js';

let isClickModeActive = false;
let useAI = true; 

function updateApiStatus() {
  const apiStatusDiv = document.getElementById('api-status');
  const apiStatusText = document.getElementById('api-status-text');
  
  if (isApiConfigured()) {
    apiStatusDiv.style.backgroundColor = '#dcfce7';
    apiStatusDiv.style.border = '1px solid #22c55e';
    apiStatusText.innerHTML = '✅ <strong>AI Enabled:</strong> AI API configured';
  } else {
    apiStatusDiv.style.backgroundColor = '#fef3c7';
    apiStatusDiv.style.border = '1px solid #f59e0b';
    apiStatusText.innerHTML = '⚠️ <strong>AI Disabled:</strong> Add AI API key in config.js<br><small>Get your API key from your AI provider</small>';
  }
}

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

function updateToggleStatus() {
  const aiToggle = document.getElementById('aiToggle');
  aiToggle.checked = useAI;
  
  const apiStatusText = document.getElementById('api-status-text');
  if (useAI) {
    if (isApiConfigured()) {
      apiStatusText.innerHTML = '✅ <strong>AI Enabled:</strong> AI API configured';
    } else {
      apiStatusText.innerHTML = '⚠️ <strong>AI Selected:</strong> But API key not configured';
    }
  } else {
    apiStatusText.innerHTML = '🔄 <strong>Local Mode:</strong> Using local XPath generation';
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
      const modeText = useAI ? "AI-powered" : "local";
      output.innerHTML = `🔍 <b>Click Mode Active!</b><br>Click on any element to get its XPath using ${modeText} generation.`;
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

function handleAIToggle() {
  useAI = !useAI;
  updateToggleStatus();
  
  chrome.storage.local.set({ useAI: useAI });
  
  if (isClickModeActive) {
    const output = document.getElementById('output');
    const modeText = useAI ? "AI-powered" : "local";
    output.innerHTML = `🔍 <b>Click Mode Active!</b><br>Click on any element to get its XPath using ${modeText} generation.`;
  }
}

document.getElementById("toggleClickMode").addEventListener("click", handleToggleClickMode);
document.getElementById("aiToggle").addEventListener("change", handleAIToggle);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'clickModeDeactivated') {
    isClickModeActive = false;
    updateClickModeButton();
    document.getElementById('output').innerHTML = "Enable <b>Click Mode</b> to get XPath for specific elements.";
  } else if (request.action === 'generateXPathWithAI') {
    handleAIXPathGeneration(request, sendResponse);
    return true; 
  } else if (request.action === 'getGenerationMode') {
    sendResponse({ useAI: useAI });
  }
});

async function handleAIXPathGeneration(request, sendResponse) {
  try {
    console.log('Popup: Generating XPath with AI for element:', request.elementInfo);
    console.log('Popup: AI configured:', isApiConfigured());
    
    if (!isApiConfigured()) {
      console.log('Popup: AI not configured, sending error');
      sendResponse({ error: "AI API key not configured. Please add your API key in config.js" });
      return;
    }
    
    console.log('Popup: Calling AI API...');
    const xpathResult = await callAIAPI(request.elementHTML, true);
    console.log('Popup: AI API response:', xpathResult);
    
    const lines = xpathResult.split('\n');
    let xpath = '';
    
    for (const line of lines) {
      if (line.trim().startsWith('//')) {
        xpath = line.trim();
        break;
      }
    }
    
    if (!xpath) {
      xpath = xpathResult.trim();
    }
    
    console.log('Popup: Extracted XPath:', xpath);
    sendResponse({ xpath: xpath });
  } catch (error) {
    console.error('Popup: Error generating XPath with AI:', error);
    sendResponse({ error: error.message });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const result = await chrome.storage.local.get(['useAI']);
  useAI = result.useAI !== undefined ? result.useAI : true;
  
  updateApiStatus();
  updateToggleStatus();
});
