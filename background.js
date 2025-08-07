import { callAIAPI } from './api.js';
import { isApiConfigured } from './config.js';

// Store AI mode state in background script
let aiModeActive = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'elementClicked') {
    chrome.runtime.sendMessage(request).catch(() => {
      console.log('Popup not open, element clicked:', request.elementInfo);
    });
  } else if (request.action === 'generateXPathWithAI') {
    handleAIXPathGeneration(request, sendResponse);
    return true;
  } else if (request.action === 'getGenerationMode') {
    handleGetGenerationMode(sendResponse);
    return true; 
  } else if (request.action === 'setAIMode') {
    // New action to set AI mode state
    aiModeActive = request.enabled;
    console.log('Background: AI mode set to:', aiModeActive);
    sendResponse({ success: true });
    return true;
  }
  return true;
});

async function handleAIXPathGeneration(request, sendResponse) {
  try {
    console.log('Background: Generating XPath with AI for element:', request.elementInfo);
    console.log('Background: AI configured:', isApiConfigured());
    console.log('Background: Request type:', request.requestType);
    
    if (!isApiConfigured()) {
      console.log('Background: AI not configured, sending error');
      sendResponse({ error: "AI API key not configured. Please add your API key in config.js" });
      return;
    }
    
    console.log('Background: Calling AI API...');
    const result = await callAIAPI(request.elementHTML, true, request.elementInfo, request.requestType);
    console.log('Background: AI API response:', result);
    
    if (request.requestType === 'id_or_xpath') {
      // Handle ID or XPath response
      if (result && (result.id || result.xpath)) {
        console.log('Background: Extracted result:', result);
        sendResponse(result);
      } else {
        console.log('Background: No valid result from AI');
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
      
      console.log('Background: Extracted XPath:', xpath);
      sendResponse({ xpath: xpath });
    }
  } catch (error) {
    console.error('Background: Error generating XPath with AI:', error);
    sendResponse({ error: error.message });
  }
}

async function handleGetGenerationMode(sendResponse) {
  try {
    // Return the current AI mode state from background script
    const useAI = aiModeActive && isApiConfigured();
    console.log('Background: Generation mode requested, AI mode:', aiModeActive, 'useAI:', useAI);
    sendResponse({ useAI: useAI });
  } catch (error) {
    console.error('Background: Error getting generation mode:', error);
    sendResponse({ useAI: false }); 
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(() => {
    
    });
  }
}); 