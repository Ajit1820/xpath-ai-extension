import { extractRelevantHTML } from "./dom.js";
import { callGeminiAPI } from "./api.js";

document.getElementById("generateBtn").addEventListener("click", async () => {
  const output = document.getElementById("output");
  output.innerText = "Extracting elements...";

  try {
    const filteredHTML = await extractRelevantHTML();
    output.innerText = "Calling Gemini AI...";
    const result = await callGeminiAPI(filteredHTML);
    function renderOutput(text) {
  const container = document.getElementById("output");
  container.innerHTML = "";

  const lines = text.split("\n");

  let currentLabel = "";

  lines.forEach(line => {
    const trimmed = line.trim();

    // Capture element label
    const labelMatch = trimmed.match(/^(\*+|\d+\.)\s*(.+?)[:：]?\s*$/);
    if (labelMatch) {
      currentLabel = labelMatch[2];
    }

    // Render XPath line
    if (trimmed.startsWith("//")) {
      const wrapper = document.createElement("div");
      wrapper.className = "copy-line";

      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.textContent = "📋";
      btn.onclick = () => {
        navigator.clipboard.writeText(trimmed);
        btn.textContent = "✅";
        setTimeout(() => (btn.textContent = "📋"), 1000);
      };

      const lineText = document.createElement("code");
      lineText.textContent = `${currentLabel} : ${trimmed}`;

      wrapper.appendChild(btn);
      wrapper.appendChild(lineText);
      container.appendChild(wrapper);
    }
  });
}


    renderOutput(result);
  } catch (err) {
    output.innerText = `❌ Error: ${err.message}`;
  }
});

document.getElementById("copyAllBtn").addEventListener("click", () => {
  const allLines = document.querySelectorAll("#output code");
  const text = Array.from(allLines)
    .map((code) => code.textContent)
    .join("\n");

  navigator.clipboard.writeText(text);
  const btn = document.getElementById("copyAllBtn");
  btn.textContent = "✅ All Copied";
  setTimeout(() => (btn.textContent = "Copy All"), 1000);
});
