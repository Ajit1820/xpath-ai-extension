
let isClickModeActive = false;
let clickListener = null;
let lastClickedElement = null;
let xpathResultPanel = null;

if (!window.xpathExtensionInitialized) {
  window.xpathExtensionInitialized = true;
  console.log('XPath Extension: Content script initialized');
}

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
    console.log('Element clicked:', request.elementInfo);
  }
  return true;
});

function enableClickDetection() {
  if (clickListener) {
    console.log('Click detection already enabled');
    return;
  }
  
  console.log('Enabling click detection');
  
  clickListener = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    let element = event.target;
    
    // Try to find a better element to work with
    // First, try to find an element with an ID
    let current = element;
    while (current && current !== document.body) {
      if (current.id && current.id.trim()) {
        element = current;
        break;
      }
      current = current.parentElement;
    }
    
    // If no element with ID found, try to find an element with meaningful attributes
    if (!element.id || !element.id.trim()) {
      current = element;
      while (current && current !== document.body) {
        if (current.tagName && 
            (current.className || current.getAttribute('data-testid') || current.getAttribute('aria-label'))) {
          element = current;
          break;
        }
        current = current.parentElement;
      }
    }
  
    if (isElementInXPathPanel(element)) {
      console.log('Clicked element is part of XPath panel, ignoring');
      return false;
    }
    
    lastClickedElement = element;
    
    console.log('Element clicked:', element.tagName, element.className, 'ID:', element.id);
    
    highlightElement(element);
    
    showXPathResultPanel('Generating XPath...', element);
    
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
    
    generateXPathDirectly(element);
    
    return false;
  };
  
  document.addEventListener('click', clickListener, true);
  document.body.style.cursor = 'crosshair';
}

function isElementInXPathPanel(element) {
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
  removeAllHighlights();
  
  element.style.outline = '3px solid #ff6b6b';
  element.style.outlineOffset = '2px';
  element.style.transition = 'outline 0.2s ease';
  
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
  
  chrome.runtime.sendMessage({
    action: 'clickModeDeactivated'
  }).catch(() => {
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
    console.log('Content: Checking if element has ID...');
    console.log('Content: Element ID:', element.id);
    
    // Get AI mode state from background script
    let useAI = false;
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getGenerationMode' });
      console.log('Content: Background response:', response);
      
      if (response && typeof response.useAI === 'boolean') {
        useAI = response.useAI;
        console.log('Content: Got AI mode from background:', useAI);
      } else {
        useAI = false;
        console.log('Content: No valid response from background, defaulting AI mode to OFF');
      }
    } catch (error) {
      console.log('Content: Error getting AI mode, defaulting to local generation');
      useAI = false;
    }
    
    console.log('Content: Final AI mode decision:', useAI);
    
    if (useAI) {
      // AI Mode ON: Send request to LLM with instructions to return ID if exists, else XPath
      console.log('Content: AI Mode ON - sending request to LLM');
      await generateWithAI(element);
    } else {
      // AI Mode OFF: Handle ID vs XPath logic locally
      console.log('Content: AI Mode OFF - handling locally');
      if (hasValidID(element)) {
        console.log('Content: Element has valid ID, generating ID result');
        generateIDResult(element);
      } else {
        console.log('Content: Element has no valid ID, generating XPath locally');
        updateXPathResultPanel('🔄 Generating XPath locally...');
        generateLocalXPath(element);
      }
    }
  } catch (error) {
    console.error('Error generating result:', error);
    updateXPathResultPanel(`❌ Error generating result: ${error.message}`);
  }
}

function hasValidID(element) {
  // Check if element has an ID
  if (!element.id || !element.id.trim()) {
    return false;
  }
  
  const id = element.id.trim();
  
  // Check if ID follows common dynamic patterns
  const dynamicPatterns = [
    /^.*-\d+$/, // Ends with dash and numbers (e.g., "mat-mdc-form-field-label-12")
    /^.*_\d+$/, // Ends with underscore and numbers
    /^.*\d+$/,  // Ends with numbers (e.g., "element123")
    /^\d+.*$/,  // Starts with numbers
    /^.*\d{2,}.*$/, // Contains 2 or more consecutive numbers
    /^.*-\d+-.*$/, // Contains dash-number-dash pattern
    /^.*_\d+_.*$/, // Contains underscore-number-underscore pattern
  ];
  
  for (const pattern of dynamicPatterns) {
    if (pattern.test(id)) {
      console.log('Content: ID matches dynamic pattern:', id, 'Pattern:', pattern);
      return false;
    }
  }
  
  // Additional check for common dynamic ID patterns
  if (id.includes('-') && /\d/.test(id)) {
    // Check if it's a common dynamic pattern like "mat-mdc-form-field-label-12"
    const parts = id.split('-');
    const lastPart = parts[parts.length - 1];
    if (/^\d+$/.test(lastPart)) {
      console.log('Content: ID ends with numeric part, considered dynamic:', id);
      return false;
    }
  }
  
  console.log('Content: ID is valid (not dynamic):', id);
  return true;
}

function generateIDResult(element) {
  const elementInfo = {
    tagName: element.tagName.toLowerCase(),
    id: element.id,
    className: element.className,
    textContent: element.textContent?.trim().substring(0, 50) || ''
  };
  
  const result = `
    <div style="margin-bottom: 10px; background: #f0f9ff; padding: 8px; border-radius: 4px;">
      <strong>Element:</strong> ${elementInfo.tagName}
      ${elementInfo.textContent ? `<br><strong>Text:</strong> "${elementInfo.textContent}"` : ''}
    </div>
    <div style="background: #f8fafc; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
      <strong>Element ID:</strong><br>
      <code style="color: #1e40af; word-break: break-all;">${element.id}</code>
      <button id="copy-id-btn" class="xpath-extension-element" style="
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
  
  const copyBtn = document.getElementById('copy-id-btn');
  if (copyBtn) {
    copyBtn.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Copy button clicked');
      copyXPathToClipboard(element.id);
    });
  }
}

function generateLocalXPath(element) {
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
      <strong>Local XPath:</strong><br>
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
  
  const copyBtn = document.getElementById('copy-xpath-btn');
  if (copyBtn) {
    copyBtn.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Copy button clicked');
      copyXPathToClipboard(xpath);
    });
  }
}



function copyXPathToClipboard(xpathText) {
  console.log('Copying XPath:', xpathText);
  
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
  let copyBtn = document.getElementById('copy-xpath-btn');
  if (!copyBtn) {
    copyBtn = document.getElementById('copy-id-btn');
  }
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
  if (element.id && element.id.trim()) {
    return `//${element.tagName.toLowerCase()}[@id='${element.id}']`;
  }
  if (element.tagName.toLowerCase() === 'img') {
    const src = element.getAttribute('src');
    if (src && src.trim()) {
      const baseXPath = `//img[contains(@src, '${src.split('/').pop()}')]`;
      
      const matchingElements = document.evaluate(baseXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      
      if (matchingElements.snapshotLength > 1) {
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
  
  if (element.tagName.toLowerCase() === 'input') {
    const placeholder = element.getAttribute('placeholder');
    const className = element.getAttribute('class');
    if (placeholder && placeholder.trim() && className && className.trim()) {
      const classes = className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        const specificClass = classes.find(c => c.includes('-') || c.length > 5) || classes[0];
        const baseXPath = `//input[contains(@class, '${specificClass}') and @placeholder="${placeholder.replace(/"/g, '\\"')}"]`;
        
        const matchingElements = document.evaluate(baseXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        
        if (matchingElements.snapshotLength > 1) {
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

  const cleanTextContent = getCleanTextContent(element);
  if (cleanTextContent && cleanTextContent.length > 0 && cleanTextContent.length < 100) {
    const escapedText = cleanTextContent.replace(/'/g, "\\'").replace(/"/g, '\\"');
    const baseXPath = `//${element.tagName.toLowerCase()}[text()='${escapedText}']`;
    
    const matchingElements = document.evaluate(baseXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    
    if (matchingElements.snapshotLength > 1) {
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
    
   
    const matchingElements = document.evaluate(baseXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    
    if (matchingElements.snapshotLength > 1) {
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
  
  return generatePositionBasedXPath(element);
}

function getCleanTextContent(element) {
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
  
  if (element.className && element.className.trim()) {
    const classes = element.className.split(' ').filter(c => c.trim() && c !== 'mat-mdc-card-title');
    if (classes.length > 0) {
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
  const maxDepth = 5;
  
  while (current && current !== document.body && depth < maxDepth) {
    let index = 1;
    let sibling = current.previousElementSibling;
    
    while (sibling) {
      if (sibling.tagName === current.tagName) {
        index++;
      }
      sibling = sibling.previousElementSibling;
    }
    
    const tagName = current.tagName.toLowerCase();
    
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

function getElementContext(element) {
  const context = {
    position: getElementPosition(element),
    parentInfo: getParentInfo(element),
    siblings: getSiblingInfo(element),
    uniqueAttributes: getUniqueAttributes(element)
  };
  
  return context;
}

function getElementPosition(element) {
  const tagName = element.tagName.toLowerCase();
  const textContent = element.textContent?.trim();
  const className = element.className;
  
  let position = 1;
  let similarElements = [];
  
  if (textContent) {
    similarElements = Array.from(document.querySelectorAll(`${tagName}`)).filter(el => 
      el.textContent?.trim() === textContent
    );
    
    console.log(`Found ${similarElements.length} elements with text: "${textContent}"`);
    
    if (similarElements.length > 1) {
      const uniqueElements = [];
      const seenElements = new Set();
      
      for (const el of similarElements) {
        const elementId = `${el.tagName}-${el.textContent?.trim()}-${el.className}-${el.id}`;
        
        if (!seenElements.has(elementId)) {
          seenElements.add(elementId);
          uniqueElements.push(el);
        }
      }
      
      similarElements = uniqueElements;
      console.log(`After deduplication: ${similarElements.length} unique elements`);
    }
  } else if (className) {
    try {
      const escapedClasses = className.split(' ').map(c => {
        return c.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '\\$&');
      }).join('.');
      
      similarElements = Array.from(document.querySelectorAll(`${tagName}.${escapedClasses}`));
    } catch (error) {
      console.log('Error with class selector, falling back to tag name only');
      similarElements = Array.from(document.querySelectorAll(tagName));
    }
  } else {
    similarElements = Array.from(document.querySelectorAll(tagName));
  }
  
  for (let i = 0; i < similarElements.length; i++) {
    if (similarElements[i] === element) {
      position = i + 1;
      break;
    }
  }
  
  const needsIndexing = similarElements.length > 1;
  
  console.log(`Element position: ${position}/${similarElements.length}, needsIndexing: ${needsIndexing}`);
  
  return {
    position: position,
    totalSimilar: similarElements.length,
    needsIndexing: needsIndexing
  };
}

function getParentInfo(element) {
  const parent = element.parentElement;
  if (!parent) return null;
  
  return {
    tagName: parent.tagName.toLowerCase(),
    id: parent.id,
    className: parent.className,
    hasUniqueId: !!parent.id,
    hasUniqueClass: parent.className && parent.className.trim() !== ''
  };
}

function getSiblingInfo(element) {
  const parent = element.parentElement;
  if (!parent) return null;
  
  const siblings = Array.from(parent.children).filter(child => child.tagName === element.tagName);
  
  return {
    totalSiblings: siblings.length,
    position: siblings.indexOf(element) + 1,
    needsSiblingIndex: siblings.length > 1
  };
}

function getUniqueAttributes(element) {
  const uniqueAttrs = [];
  
  if (element.id) uniqueAttrs.push('id');
  if (element.getAttribute('data-testid')) uniqueAttrs.push('data-testid');
  if (element.getAttribute('data-cy')) uniqueAttrs.push('data-cy');
  if (element.getAttribute('aria-label')) uniqueAttrs.push('aria-label');
  if (element.getAttribute('name')) uniqueAttrs.push('name');
  if (element.getAttribute('title')) uniqueAttrs.push('title');
  if (element.getAttribute('alt')) uniqueAttrs.push('alt');
  if (element.getAttribute('href')) uniqueAttrs.push('href');
  if (element.getAttribute('src')) uniqueAttrs.push('src');
  if (element.getAttribute('placeholder')) uniqueAttrs.push('placeholder');
  
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c.trim());
    if (classes.length > 0) {
      const shortClasses = classes.filter(c => 
        c.length <= 15 && 
        !c.includes('ng-') && 
        !c.includes('md:') && 
        !c.includes('text-[') &&
        !c.includes('basis-[') &&
        !c.includes('flex-')
      );
      
      if (shortClasses.length > 0) {
        
        const sortedClasses = shortClasses.sort((a, b) => {
          // Prefer shorter classes
          if (a.length !== b.length) return a.length - b.length;
          
          const aCount = document.querySelectorAll(`.${a}`).length;
          const bCount = document.querySelectorAll(`.${b}`).length;
          return aCount - bCount;
        });
        
        const uniqueShortClass = sortedClasses.find(c => {
          try {
            const escapedClass = c.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '\\$&');
            const similarElements = document.querySelectorAll(`.${escapedClass}`);
            return similarElements.length === 1;
          } catch (error) {
            console.log('Error checking class uniqueness:', error);
            return false;
          }
        });
        
        if (uniqueShortClass) {
          uniqueAttrs.push('short-class');
        }
      }
    }
  }
  
  return uniqueAttrs;
}

async function generateWithAI(element) {
  console.log('Content: Generating with AI - checking for ID or XPath');
  
  updateXPathResultPanel('🤖 Analyzing element with AI...');
  
  const elementContext = getElementContext(element);
  const elementInfo = {
    tagName: element.tagName.toLowerCase(),
    id: element.id,
    className: element.className,
    textContent: element.textContent?.trim().substring(0, 100) || '',
    attributes: getElementAttributes(element),
    context: elementContext
  };
  
  try {
    const aiResponse = await chrome.runtime.sendMessage({
      action: 'generateXPathWithAI',
      elementHTML: element.outerHTML,
      elementInfo: elementInfo,
      requestType: 'id_or_xpath' // New parameter to indicate this is a combined request
    });
    
    console.log('Content: AI response received:', aiResponse);
    
    if (aiResponse && (aiResponse.id || aiResponse.xpath)) {
      console.log('Content: Processing successful AI response');
      
      if (aiResponse.id) {
        // AI returned an ID
        console.log('Content: AI returned ID:', aiResponse.id);
        generateIDResultFromAI(element, aiResponse.id);
      } else if (aiResponse.xpath) {
        // AI returned XPath
        console.log('Content: AI returned XPath:', aiResponse.xpath);
        generateXPathResultFromAI(element, aiResponse.xpath);
      }
    } else if (aiResponse && aiResponse.error) {
      console.error('Content: AI generation error received:', aiResponse.error);
      updateXPathResultPanel(`❌ AI Error: ${aiResponse.error}`);
    } else {
      console.log('Content: AI generation failed - no valid response');
      updateXPathResultPanel(`❌ AI generation failed. Please try again or switch to local generation.`);
    }
  } catch (aiError) {
    console.error('Content: AI request failed with exception:', aiError);
    updateXPathResultPanel(`❌ AI Error: ${aiError.message}`);
  }
}

function generateIDResultFromAI(element, id) {
  const elementInfo = {
    tagName: element.tagName.toLowerCase(),
    id: id,
    className: element.className,
    textContent: element.textContent?.trim().substring(0, 50) || ''
  };
  
  const result = `
    <div style="margin-bottom: 10px; background: #f0f9ff; padding: 8px; border-radius: 4px;">
      <strong>Element:</strong> ${elementInfo.tagName}
      ${elementInfo.textContent ? `<br><strong>Text:</strong> "${elementInfo.textContent}"` : ''}
    </div>
    <div style="background: #f8fafc; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
      <strong>AI Generated ID:</strong><br>
      <code style="color: #1e40af; word-break: break-all;">${id}</code>
      <button id="copy-id-btn" class="xpath-extension-element" style="
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
  
  const copyBtn = document.getElementById('copy-id-btn');
  if (copyBtn) {
    copyBtn.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Copy button clicked');
      copyXPathToClipboard(id);
    });
  }
}

function generateXPathResultFromAI(element, xpath) {
  const elementInfo = {
    tagName: element.tagName.toLowerCase(),
    id: element.id,
    className: element.className,
    textContent: element.textContent?.trim().substring(0, 50) || ''
  };
  
  const result = `
    <div style="margin-bottom: 10px; background: #f0f9ff; padding: 8px; border-radius: 4px;">
      <strong>Element:</strong> ${elementInfo.tagName}
      ${elementInfo.textContent ? `<br><strong>Text:</strong> "${elementInfo.textContent}"` : ''}
    </div>
    <div style="background: #f8fafc; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
      <strong>AI Generated XPath:</strong><br>
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
  
  const copyBtn = document.getElementById('copy-xpath-btn');
  if (copyBtn) {
    copyBtn.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Copy button clicked');
      copyXPathToClipboard(xpath);
    });
  }
}


