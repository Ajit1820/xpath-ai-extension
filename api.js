export async function callGeminiAPI(filteredHTML) {
  const API_KEY = "AIzaSyBIpZW0d-WPhfR6KMnthaLbSVjA--qgyys"; // Replace this with your actual key

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You're an expert in XPath generation for UI test automation.

                        For the following HTML elements, generate XPaths in this format only:

                        1. [Element Label]
                        <XPath>

                        Output only:
                        - The label (what the element is)
                        - Then the XPath on the next line
                        - Then a blank line
                        NO markdown formatting, NO code blocks, NO extra explanations.

                        Example format:
                        1. Search Input
                        //input[@placeholder='Search']

                        2. Login Button
                        //button[text()='Login']

                        Here is the HTML:\n\n${filteredHTML}`,
              },
            ],
          },
        ],
      }),
    }
  );

  const resultText = await response.text();

  if (!response.ok) {
    throw new Error(`Gemini API Error (${response.status}):\n${resultText}`);
  }

  const data = JSON.parse(resultText);
  const xpaths =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "⚠️ Gemini returned no result.";
  return xpaths;
}
