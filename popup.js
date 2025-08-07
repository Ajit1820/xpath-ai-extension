import { toggleClickMode } from './dom.js';
import { callAIAPI } from './api.js';
import { isApiConfigured } from './config.js';

let isClickModeActive = false;
let isAIModeActive = false;

function updateApiStatus() {
  const apiStatusDiv = document.getElementById('api-status');
  const apiStatusText = document.getElementById('api-status-text');
  
  if (isApiConfigured()) {
    apiStatusDiv.style.backgroundColor = '#dcfce7';
    apiStatusDiv.style.border = '1px solid #22c55e';
    apiStatusText.innerHTML = '✅ <strong>AI Available:</strong> AI API configured for ID and XPath generation';
  } else {
    apiStatusDiv.style.backgroundColor = '#fef3c7';
    apiStatusDiv.style.border = '1px solid #f59e0b';
    apiStatusText.innerHTML = '⚠️ <strong>AI Unavailable:</strong> Add AI API key in config.js<br><small>Will use local ID and XPath generation only</small>';
  }
}

function updateAIModeButton() {
  const toggleSwitch = document.getElementById('toggleAIMode');
  if (!isApiConfigured()) {
    toggleSwitch.disabled = true;
    toggleSwitch.checked = false;
    return;
  }
  
  toggleSwitch.disabled = false;
  toggleSwitch.checked = isAIModeActive;
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

async function handleToggleAIMode() {
  if (!isApiConfigured()) {
    return;
  }
  
  isAIModeActive = !isAIModeActive;
  updateAIModeButton();
  
  // Send AI mode state to background script
  try {
    await chrome.runtime.sendMessage({ 
      action: 'setAIMode', 
      enabled: isAIModeActive 
    });
    console.log('Popup: AI mode state sent to background:', isAIModeActive);
  } catch (error) {
    console.error('Popup: Error sending AI mode to background:', error);
  }
  
  // No dynamic message - keep static message
}

async function handleToggleClickMode() {
  const output = document.getElementById('output');
  
  try {
    isClickModeActive = !isClickModeActive;
    await toggleClickMode(isClickModeActive);
    updateClickModeButton();
    
    // No dynamic message - keep static message
  } catch (err) {
    console.error('Toggle error:', err);
    output.innerHTML = `❌ Error: ${err.message}<br><br>Try refreshing the page and try again.`;
    isClickModeActive = !isClickModeActive;
    updateClickModeButton();
  }
}

document.getElementById("toggleAIMode").addEventListener("change", handleToggleAIMode);
document.getElementById("toggleClickMode").addEventListener("click", handleToggleClickMode);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'clickModeDeactivated') {
    isClickModeActive = false;
    updateClickModeButton();
    // No dynamic message - keep static message
  } else if (request.action === 'generateXPathWithAI') {
    handleAIXPathGeneration(request, sendResponse);
    return true; 
  } else if (request.action === 'getGenerationMode') {
    // Return the current AI mode state
    const useAI = isAIModeActive && isApiConfigured();
    console.log('Popup: getGenerationMode requested, returning useAI:', useAI);
    sendResponse({ useAI: useAI });
    return true;
  }
});

async function handleAIXPathGeneration(request, sendResponse) {
  try {
    console.log('Popup: Generating XPath with AI for element:', request.elementInfo);
    console.log('Popup: AI configured:', isApiConfigured());
    console.log('Popup: Request type:', request.requestType);
    
    if (!isApiConfigured()) {
      console.log('Popup: AI not configured, sending error');
      sendResponse({ error: "AI API key not configured. Please add your API key in config.js" });
      return;
    }
    
    console.log('Popup: Calling AI API...');
    const result = await callAIAPI(request.elementHTML, true, request.elementInfo, request.requestType);
    console.log('Popup: AI API response:', result);
    
    if (request.requestType === 'id_or_xpath') {
      // Handle ID or XPath response
      if (result && (result.id || result.xpath)) {
        console.log('Popup: Extracted result:', result);
        sendResponse(result);
      } else {
        console.log('Popup: No valid result from AI');
        sendResponse({ error: "AI returned no valid ID or XPath" });
      }
    } else {
      // Handle original XPath-only response
      const lines = result.split('\n');
      let xpath = '';
      
      for (const line of lines) {
        if (line.trim().startsWith('//')) {
          xpath = line.trim();
          break;
        }
      }
      
      if (!xpath) {
        xpath = result.trim();
      }
      
      console.log('Popup: Extracted XPath:', xpath);
      sendResponse({ xpath: xpath });
    }
  } catch (error) {
    console.error('Popup: Error generating XPath with AI:', error);
    sendResponse({ error: error.message });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  updateApiStatus();
  updateAIModeButton();
  updateClickModeButton();
  
  // Initialize AI mode state in background script
  if (isApiConfigured()) {
    try {
      await chrome.runtime.sendMessage({ 
        action: 'setAIMode', 
        enabled: isAIModeActive 
      });
      console.log('Popup: Initial AI mode state sent to background:', isAIModeActive);
    } catch (error) {
      console.error('Popup: Error sending initial AI mode to background:', error);
    }
  }
});
