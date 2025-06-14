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
