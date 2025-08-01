export async function extractRelevantHTML() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const [tab] = tabs;

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const elements = [...document.querySelectorAll("input, button, a, select, textarea")];
          return elements.map(el => el.outerHTML).join("\n");
        },
      }, (results) => {
        const filteredHTML = results?.[0]?.result;
        if (filteredHTML) resolve(filteredHTML);
        else reject(new Error("Could not extract HTML elements."));
      });
    });
  });
}

export async function extractClickedElement() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const [tab] = tabs;

      chrome.tabs.sendMessage(tab.id, { action: 'getClickedElement' }, (response) => {
        if (response && response.element) {
          resolve(response.element.outerHTML);
        } else {
          reject(new Error("No element has been clicked yet. Please click on an element first."));
        }
      });
    });
  });
}

export async function toggleClickMode(enabled) {
  return new Promise((resolve, reject) => {
    console.log('dom.js: toggleClickMode called with enabled=', enabled);
    
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const [tab] = tabs;
      if (!tab) { 
        console.error('dom.js: No active tab found');
        reject(new Error("No active tab found.")); 
        return; 
      }
      
      console.log('dom.js: Found active tab:', tab.id, tab.url);
      
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }, (injectionResult) => {
        console.log('dom.js: Content script injection result:', injectionResult);
        
        if (chrome.runtime.lastError) {
          console.error('dom.js: Script injection error:', chrome.runtime.lastError);
          reject(new Error(`Script injection error: ${chrome.runtime.lastError.message}`));
          return;
        }
        
        const message = {
          action: 'toggleClickMode',
          enabled: enabled
        };
        
        console.log('dom.js: Sending message to content script:', message);
        
        chrome.tabs.sendMessage(tab.id, message, (response) => {
          console.log('dom.js: Response from content script:', response);
          
          if (chrome.runtime.lastError) {
            console.error('dom.js: Runtime error:', chrome.runtime.lastError);
            reject(new Error(`Communication error: ${chrome.runtime.lastError.message}`));
          } else if (response && response.success) {
            console.log('dom.js: Successfully toggled click mode');
            resolve();
          } else {
            console.error('dom.js: Failed to toggle click mode, response:', response);
            reject(new Error("Failed to toggle click mode. Please refresh the page and try again."));
          }
        });
      });
    });
  });
}
