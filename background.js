// Background script to handle communication between popup and content script

// Listen for messages from content script and forward to popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'elementClicked') {
    // Forward the clicked element info to the popup
    chrome.runtime.sendMessage(request).catch(() => {
      // Popup might not be open, that's okay
      console.log('Popup not open, element clicked:', request.elementInfo);
    });
  }
  
  // Always return true for async response
  return true;
});

// Handle tab updates to ensure content script is ready
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    // Inject content script when page loads
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(() => {
      // Ignore errors for restricted pages
    });
  }
}); 