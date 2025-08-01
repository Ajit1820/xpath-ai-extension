
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'elementClicked') {
    chrome.runtime.sendMessage(request).catch(() => {
      console.log('Popup not open, element clicked:', request.elementInfo);
    });
  }
  return true;
});


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(() => {
    
    });
  }
}); 