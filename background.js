import { callAIAPI } from './api.js';
import { isApiConfigured } from './config.js';

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
  }
  return true;
});

async function handleAIXPathGeneration(request, sendResponse) {
  try {
    console.log('Background: Generating XPath with AI for element:', request.elementInfo);
    console.log('Background: AI configured:', isApiConfigured());
    
    if (!isApiConfigured()) {
      console.log('Background: AI not configured, sending error');
      sendResponse({ error: "AI API key not configured. Please add your API key in config.js" });
      return;
    }
    
    console.log('Background: Calling AI API...');
    const xpathResult = await callAIAPI(request.elementHTML, true, request.elementInfo);
    console.log('Background: AI API response:', xpathResult);
    
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
    
    console.log('Background: Extracted XPath:', xpath);
    sendResponse({ xpath: xpath });
  } catch (error) {
    console.error('Background: Error generating XPath with AI:', error);
    sendResponse({ error: error.message });
  }
}

async function handleGetGenerationMode(sendResponse) {
  try {
    const result = await chrome.storage.local.get(['useAI']);
    const useAI = result.useAI !== undefined ? result.useAI : true;
    console.log('Background: Generation mode requested, useAI:', useAI);
    sendResponse({ useAI: useAI });
  } catch (error) {
    console.error('Background: Error getting generation mode:', error);
    sendResponse({ useAI: true }); 
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