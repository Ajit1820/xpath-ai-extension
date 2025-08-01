import { CONFIG, isApiConfigured } from './config.js';

export async function callAIAPI(filteredHTML, isSingleElement = false, elementInfo = null) {
  console.log('API: Starting AI API call, isSingleElement:', isSingleElement);
  
  if (!isApiConfigured()) {
    console.log('API: AI API not configured');
    throw new Error("AI API key not configured. Please add your API key in config.js");
  }

  console.log('API: AI API is configured, creating prompt...');

  const prompt = isSingleElement 
    ? `You're an expert in XPath generation for UI test automation.

       For the following single HTML element, generate the SHORTEST and MOST SPECIFIC XPath expression that targets ONLY this exact element.
       
       CRITICAL: Check the context information below. If "needsIndexing: false", generate XPath WITHOUT position indexing.
       If "needsIndexing: true", generate XPath WITH position indexing.
       
       OUTPUT FORMAT: Generate ONLY the XPath expression, no descriptions or labels.
       Example: //h2[text()='Solusi Kesehatan di Tanganmu']
       NOT: "Title (//h2[text()='Solusi Kesehatan di Tanganmu'])[2]"
       
       ${elementInfo && elementInfo.context ? `
       ELEMENT CONTEXT:
       - Position: ${elementInfo.context.position.position} of ${elementInfo.context.position.totalSimilar} similar elements
       - Needs indexing: ${elementInfo.context.position.needsIndexing}
       - Parent: ${elementInfo.context.parentInfo ? `${elementInfo.context.parentInfo.tagName}${elementInfo.context.parentInfo.id ? '#' + elementInfo.context.parentInfo.id : ''}` : 'none'}
       - Siblings: ${elementInfo.context.siblings ? `${elementInfo.context.siblings.position} of ${elementInfo.context.siblings.totalSiblings}` : 'none'}
       - Unique attributes: ${elementInfo.context.uniqueAttributes.join(', ') || 'none'}
       ` : ''}

       IMPORTANT RULES:
       1. Generate the SHORTEST possible XPath that uniquely identifies the element
       2. Prioritize in this order: id > data-testid > aria-label > name > text content > short class
       3. AVOID long class names - prefer text content over complex class combinations
       4. If text content is unique, ALWAYS use it: //h2[text()='Solusi Kesehatan di Tanganmu']
       5. Use position indexing ONLY when context shows "needsIndexing: true": (//p[text()='Login'])[2]
       6. Prefer simple attributes over complex class combinations
       7. Keep XPaths under 80 characters when possible
       8. CRITICAL: Check the context - if "needsIndexing: false", do NOT add position index
       9. NEVER generate XPaths that match multiple elements - always be specific to the clicked element
       10. MOST IMPORTANT: If the context shows "needsIndexing: false", the element is unique and NO indexing is needed

       Output format:
       [Element Description]
       <Short XPath>

       Examples of GOOD (short) XPaths:
       Login Button
       //button[text()='Login']

       Search Input
       //input[@placeholder='Search']

       Navigation Link
       //a[@href='/dashboard']

       Heading with Text
       //h2[text()='Solusi Kesehatan di Tanganmu']

       Multiple Similar Elements (ONLY use indexing when needed):
       //button[text()='Login']  // If only one exists (no indexing needed)
       (//button[text()='Login'])[2]  // ONLY if multiple exist and context shows needsIndexing: true
       
       CRITICAL EXAMPLES:
       Context: needsIndexing: false → Use: //p[text()='Chat dengan Dokter'] (NO indexing)
       Context: needsIndexing: true → Use: (//p[text()='Login'])[2] (WITH indexing)

       Examples of BAD (long) XPaths:
       //h2[@class='flex-1 text-xl md:text-2xl font-semibold basis-[25%] text-[#333]']  // Too long
       //div[@class='service-tile__title ng-star-inserted']  // Too long
       //div[contains(@class, 'service-tile') and text()='Login']  // Complex

       Here is the HTML element:\n\n${filteredHTML}`
    : `You're an expert in XPath generation for UI test automation.

       For the following HTML elements, generate SHORT and SPECIFIC XPaths that target each element uniquely.

       IMPORTANT RULES:
       1. Generate the SHORTEST possible XPath for each element
       2. Prioritize: id > data-testid > aria-label > name > short class > text content
       3. Avoid long class names - use only the most unique part
       4. Use position indexing only when necessary
       5. Keep XPaths under 100 characters when possible

       Output format:
       1. [Element Label]
       <Short XPath>

       Example format:
       1. Login Button
       //button[text()='Login']

       2. Search Input
       //input[@placeholder='Search']

       Here is the HTML:\n\n${filteredHTML}`;

  console.log('API: Making request to AI API...');
  console.log('API: URL:', `${CONFIG.AI_BASE_URL}/${CONFIG.AI_MODEL}:generateContent`);

  const response = await fetch(`${CONFIG.AI_BASE_URL}/${CONFIG.AI_MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": CONFIG.AI_API_KEY
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    })
  });

  console.log('API: AI response status:', response.status);
  const resultText = await response.text();
  console.log('API: AI response text:', resultText.substring(0, 200) + '...');

  if (!response.ok) {
    console.log('API: AI API call failed');
    let errorMessage = `AI API Error (${response.status})`;
    
    try {
      const errorData = JSON.parse(resultText);
      if (errorData.error && errorData.error.message) {
        errorMessage = `AI API Error: ${errorData.error.message}`;
      } else if (errorData.message) {
        errorMessage = `AI API Error: ${errorData.message}`;
      } else {
        errorMessage = `AI API Error (${response.status}): ${resultText}`;
      }
    } catch (parseError) {
      errorMessage = `AI API Error (${response.status}): ${resultText}`;
    }
    
    throw new Error(errorMessage);
  }

  try {
    const data = JSON.parse(resultText);
    const xpaths = data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ AI returned no result.";
    
    console.log('API: Extracted XPath result from AI:', xpaths);
    return xpaths;
  } catch (parseError) {
    console.error('API: Failed to parse AI response:', parseError);
    throw new Error(`Failed to parse AI response: ${resultText}`);
  }
}

export async function callDeepSeekAPI(filteredHTML, isSingleElement = false) {
  return callAIAPI(filteredHTML, isSingleElement);
}

export async function callOpenAIAPI(filteredHTML, isSingleElement = false) {
  return callAIAPI(filteredHTML, isSingleElement);
}

export async function callGeminiAPI(filteredHTML, isSingleElement = false) {
  return callAIAPI(filteredHTML, isSingleElement);
}
