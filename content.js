// Content script for click detection
let isClickModeActive = false;
let clickListener = null;
let lastClickedElement = null;
let xpathResultPanel = null;

// Initialize the extension
if (!window.xpathExtensionInitialized) {
  window.xpathExtensionInitialized = true;
  console.log('XPath Extension: Content script initialized');
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'toggleClickMode') {
    console.log('Toggle click mode request:', request);
    
    if (request.enabled) {
      console.log('Enabling click detection');
      enableClickDetection();
    } else {
      console.log('Disabling click detection');
      disableClickDetection();
    }
    sendResponse({ success: true });
  } else if (request.action === 'elementClicked') {
    // Handle element clicked message
    console.log('Element clicked:', request.elementInfo);
  }
  
  return true;
});

function enableClickDetection() {
  if (clickListener) {
    console.log('Click detection already enabled');
    return; // Already enabled
  }
  
  console.log('Enabling click detection');
  
  clickListener = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const element = event.target;
    
    // Check if the clicked element is part of our XPath result panel
    if (isElementInXPathPanel(element)) {
      console.log('Clicked element is part of XPath panel, ignoring');
      return false;
    }
    
    lastClickedElement = element;
    
    console.log('Element clicked:', element.tagName, element.className);
    
    // Highlight the clicked element temporarily
    highlightElement(element);
    
    // Show loading indicator
    showXPathResultPanel('Generating XPath...', element);
    
    // Send the clicked element to popup and also generate XPath directly
    chrome.runtime.sendMessage({
      action: 'elementClicked',
      elementHTML: element.outerHTML,
      elementInfo: {
        tagName: element.tagName.toLowerCase(),
        id: element.id,
        className: element.className,
        textContent: element.textContent?.trim().substring(0, 100) || '',
        attributes: getElementAttributes(element)
      }
    }).catch(error => {
      console.error('Error sending message:', error);
    });
    
    // Also generate XPath directly here
    generateXPathDirectly(element);
    
    return false;
  };
  
  document.addEventListener('click', clickListener, true);
  document.body.style.cursor = 'crosshair';
}

function isElementInXPathPanel(element) {
  // Check if the element is inside the XPath result panel
  let current = element;
  while (current && current !== document.body) {
    if (current.id === 'xpath-result-panel' || 
        current.classList.contains('xpath-extension-element')) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

function disableClickDetection() {
  console.log('Disabling click detection');
  
  if (clickListener) {
    document.removeEventListener('click', clickListener, true);
    clickListener = null;
  }
  
  document.body.style.cursor = '';
  removeAllHighlights();
  hideXPathResultPanel();
}

function highlightElement(element) {
  // Remove previous highlights
  removeAllHighlights();
  
  // Add highlight to current element
  element.style.outline = '3px solid #ff6b6b';
  element.style.outlineOffset = '2px';
  element.style.transition = 'outline 0.2s ease';
  
  // Remove highlight after 2 seconds
  setTimeout(() => {
    if (element.style.outline) {
      element.style.outline = '';
      element.style.outlineOffset = '';
    }
  }, 2000);
}

function removeAllHighlights() {
  const highlightedElements = document.querySelectorAll('[style*="outline: 3px solid #ff6b6b"]');
  highlightedElements.forEach(el => {
    el.style.outline = '';
    el.style.outlineOffset = '';
  });
}

function deactivateClickMode() {
  disableClickDetection();
  isClickModeActive = false;
  
  // Notify popup that click mode is disabled
  chrome.runtime.sendMessage({
    action: 'clickModeDeactivated'
  }).catch(() => {
    // Popup might not be open, that's okay
  });
}

function showXPathResultPanel(message, element) {
  hideXPathResultPanel();
  
  xpathResultPanel = document.createElement('div');
  xpathResultPanel.id = 'xpath-result-panel';
  xpathResultPanel.className = 'xpath-extension-element';
  xpathResultPanel.style.cssText = `
    position: fixed;
    top: 50px;
    right: 10px;
    background: white;
    border: 2px solid #3b82f6;
    border-radius: 8px;
    padding: 15px;
    font-size: 14px;
    font-family: 'Courier New', monospace;
    max-width: 400px;
    z-index: 10001;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    word-wrap: break-word;
  `;
  
  xpathResultPanel.innerHTML = `
    <div style="margin-bottom: 10px; font-weight: bold; color: #3b82f6;">
      🔍 XPath Result
    </div>
    <div id="xpath-content">${message}</div>
    <button id="close-xpath-panel" class="xpath-extension-element" style="
      position: absolute;
      top: 5px;
      right: 5px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      cursor: pointer;
      font-size: 12px;
    ">×</button>
  `;
  
  document.body.appendChild(xpathResultPanel);
  
  // Add close button functionality immediately
  const closeBtn = document.getElementById('close-xpath-panel');
  if (closeBtn) {
    closeBtn.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Close button clicked - deactivating click mode');
      deactivateClickMode();
    });
  }
}

function hideXPathResultPanel() {
  if (xpathResultPanel) {
    xpathResultPanel.remove();
    xpathResultPanel = null;
  }
}

function updateXPathResultPanel(content) {
  const contentDiv = document.getElementById('xpath-content');
  if (contentDiv) {
    contentDiv.innerHTML = content;
  }
}

async function generateXPathDirectly(element) {
  try {
    // Create a specific XPath generator
    const xpath = generateSpecificXPath(element);
    const elementInfo = {
      tagName: element.tagName.toLowerCase(),
      id: element.id,
      className: element.className,
      textContent: element.textContent?.trim().substring(0, 50) || ''
    };
    
    const result = `
      <div style="margin-bottom: 10px; background: #f0f9ff; padding: 8px; border-radius: 4px;">
        <strong>Element:</strong> ${elementInfo.tagName}
        ${elementInfo.id ? `<br><strong>ID:</strong> ${elementInfo.id}` : ''}
        ${elementInfo.textContent ? `<br><strong>Text:</strong> "${elementInfo.textContent}"` : ''}
      </div>
      <div style="background: #f8fafc; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
        <strong>XPath:</strong><br>
        <code style="color: #1e40af; word-break: break-all;">${xpath}</code>
        <button id="copy-xpath-btn" class="xpath-extension-element" style="
          margin-left: 10px;
          background: #2563eb;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">📋 Copy</button>
      </div>
    `;
    
    updateXPathResultPanel(result);
    
    // Add copy button functionality immediately
    const copyBtn = document.getElementById('copy-xpath-btn');
    if (copyBtn) {
      copyBtn.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Copy button clicked');
        copyXPathToClipboard(xpath);
      });
    }
  } catch (error) {
    console.error('Error generating XPath:', error);
    updateXPathResultPanel(`❌ Error generating XPath: ${error.message}`);
  }
}

function copyXPathToClipboard(xpathText) {
  console.log('Copying XPath:', xpathText);
  
  // Try modern clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(xpathText).then(() => {
      showCopySuccess();
    }).catch(err => {
      console.error('Clipboard API failed:', err);
      fallbackCopy(xpathText);
    });
  } else {
    fallbackCopy(xpathText);
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    showCopySuccess();
  } catch (err) {
    console.error('Fallback copy failed:', err);
    alert('Failed to copy XPath. Please select and copy manually: ' + text);
  }
  
  document.body.removeChild(textArea);
}

function showCopySuccess() {
  const copyBtn = document.getElementById('copy-xpath-btn');
  if (copyBtn) {
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✅ Copied!';
    copyBtn.style.background = '#22c55e';
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.background = '#2563eb';
    }, 1000);
  }
}

function generateSpecificXPath(element) {
  // Priority 1: ID attribute (most specific)
  if (element.id && element.id.trim()) {
    return `//${element.tagName.toLowerCase()}[@id='${element.id}']`;
  }
  
  // Priority 2: For images, prioritize src attribute
  if (element.tagName.toLowerCase() === 'img') {
    const src = element.getAttribute('src');
    if (src && src.trim()) {
      const baseXPath = `//img[contains(@src, '${src.split('/').pop()}')]`;
      
      // Check if multiple elements match this XPath
      const matchingElements = document.evaluate(baseXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      
      if (matchingElements.snapshotLength > 1) {
        // Find the position of our element among matching elements
        let position = 1;
        for (let i = 0; i < matchingElements.snapshotLength; i++) {
          if (matchingElements.snapshotItem(i) === element) {
            return `(${baseXPath})[${position}]`;
          }
          position++;
        }
      }
      
      return baseXPath;
    }
  }
  
  // Priority 2.5: For input elements with placeholder, prioritize placeholder + class combination
  if (element.tagName.toLowerCase() === 'input') {
    const placeholder = element.getAttribute('placeholder');
    const className = element.getAttribute('class');
    if (placeholder && placeholder.trim() && className && className.trim()) {
      const classes = className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        const specificClass = classes.find(c => c.includes('-') || c.length > 5) || classes[0];
        const baseXPath = `//input[contains(@class, '${specificClass}') and @placeholder="${placeholder.replace(/"/g, '\\"')}"]`;
        
        // Check if multiple elements match this XPath
        const matchingElements = document.evaluate(baseXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        
        if (matchingElements.snapshotLength > 1) {
          // Find the position of our element among matching elements
          let position = 1;
          for (let i = 0; i < matchingElements.snapshotLength; i++) {
            if (matchingElements.snapshotItem(i) === element) {
              return `(${baseXPath})[${position}]`;
            }
            position++;
          }
        }
        
        return baseXPath;
      }
    }
  }

  // Priority 3: Clean text content (very specific) - PRESERVE WHITESPACE
  const cleanTextContent = getCleanTextContent(element);
  if (cleanTextContent && cleanTextContent.length > 0 && cleanTextContent.length < 100) {
    // Escape quotes in text content but preserve whitespace
    const escapedText = cleanTextContent.replace(/'/g, "\\'").replace(/"/g, '\\"');
    const baseXPath = `//${element.tagName.toLowerCase()}[text()='${escapedText}']`;
    
    // Check if multiple elements match this XPath
    const matchingElements = document.evaluate(baseXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    
    if (matchingElements.snapshotLength > 1) {
      // Find the position of our element among matching elements
      let position = 1;
      for (let i = 0; i < matchingElements.snapshotLength; i++) {
        if (matchingElements.snapshotItem(i) === element) {
          return `(${baseXPath})[${position}]`;
        }
        position++;
      }
    }
    
    return baseXPath;
  }
  
  // Priority 4: Specific attributes combination
  const attributes = getSpecificAttributes(element);
  if (attributes.length > 0) {
    const attrConditions = attributes.map(attr => {
      if (attr.useContains) {
        return `contains(@${attr.name}, '${attr.value}')`;
      } else {
        return `@${attr.name}='${attr.value}'`;
      }
    }).join(' and ');
    const baseXPath = `//${element.tagName.toLowerCase()}[${attrConditions}]`;
    
    // Check if multiple elements match this XPath
    const matchingElements = document.evaluate(baseXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    
    if (matchingElements.snapshotLength > 1) {
      // Find the position of our element among matching elements
      let position = 1;
      for (let i = 0; i < matchingElements.snapshotLength; i++) {
        if (matchingElements.snapshotItem(i) === element) {
          return `(${baseXPath})[${position}]`;
        }
        position++;
      }
    }
    
    return baseXPath;
  }
  
  // Priority 5: Position-based with parent context
  return generatePositionBasedXPath(element);
}

function getCleanTextContent(element) {
  // Only get direct text nodes, not from child elements
  let textContent = '';
  for (let node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      textContent += node.textContent;
    }
  }
  return textContent;
}

function getSpecificAttributes(element) {
  const specificAttrs = ['name', 'data-testid', 'data-cy', 'aria-label', 'title', 'placeholder', 'value', 'alt'];
  const attributes = [];
  
  for (const attrName of specificAttrs) {
    const value = element.getAttribute(attrName);
    if (value && value.trim()) {
      attributes.push({ name: attrName, value: value.trim() });
    }
  }
  
  // Also check for unique class combinations
  if (element.className && element.className.trim()) {
    const classes = element.className.split(' ').filter(c => c.trim() && c !== 'mat-mdc-card-title');
    if (classes.length > 0) {
      // Use the most specific class
      const specificClass = classes.find(c => c.includes('-') || c.length > 5) || classes[0];
      attributes.push({ name: 'class', value: specificClass, useContains: true });
    }
  }
  
  return attributes;
}

function generatePositionBasedXPath(element) {
  let path = '';
  let current = element;
  let depth = 0;
  const maxDepth = 5; // Limit depth to avoid overly long XPaths
  
  while (current && current !== document.body && depth < maxDepth) {
    let index = 1;
    let sibling = current.previousElementSibling;
    
    // Count previous siblings of the same type
    while (sibling) {
      if (sibling.tagName === current.tagName) {
        index++;
      }
      sibling = sibling.previousElementSibling;
    }
    
    const tagName = current.tagName.toLowerCase();
    
    // Add specific attributes if available
    let conditions = [];
    if (current.id) {
      conditions.push(`@id='${current.id}'`);
    } else if (current.className && current.className.trim()) {
      const classes = current.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        const specificClass = classes.find(c => c.includes('-') || c.length > 5) || classes[0];
        conditions.push(`contains(@class, '${specificClass}')`);
      }
    }
    
    let elementPath = `/${tagName}`;
    if (conditions.length > 0) {
      elementPath += `[${conditions.join(' and ')}]`;
    } else if (index > 1) {
      elementPath += `[${index}]`;
    }
    
    path = elementPath + path;
    current = current.parentElement;
    depth++;
  }
  
  return path;
}

function getElementAttributes(element) {
  const attributes = {};
  for (let attr of element.attributes) {
    attributes[attr.name] = attr.value;
  }
  return attributes;
}
