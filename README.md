
# 🔍 XPath Generator Chrome Extension (Powered by Gemini AI)

This Chrome extension uses Gemini AI (Google's GenAI model) to generate XPath locators for input fields, buttons, and links on any webpage — instantly and accurately.

---

## 🚀 Features

- ✅ One-click XPath generation using AI
- ✅ Smart suggestions for inputs, buttons, links
- ✅ Works on all websites and internal tools
- ✅ Built-in error handling and status messages
- ✅ Easily extensible for your automation needs

---

## 🧠 Who Should Use This?

- QA Automation Engineers
- Manual Testers moving to automation
- Developers building test-friendly UIs
- Anyone using Selenium, Playwright, Cypress, Puppeteer

---

## 📦 What's Included

- Chrome extension source code
- Step-by-step setup guide
- Integration with Gemini API
- User-friendly popup interface

---

## 🛠️ Prerequisites

Before you start, make sure you have:

- ✅ Google Chrome installed
- ✅ A valid Gemini API key (get it from: https://makersuite.google.com/app/apikey)
- ✅ Basic knowledge of XPath (optional)

---

## 📥 Installation Guide

### 1. Clone or Download the Repository


git clone https://github.com/your-username/xpath-ai-extension.git

Or download the ZIP and extract the folder.

### 2. Load the Extension in Chrome

1. Open Google Chrome
2. Go to: `chrome://extensions`
3. Enable **Developer Mode** (top right)
4. Click **Load Unpacked**
5. Select the extracted folder

---

## 🔐 Configure Your Gemini API Key

1. Open `api.js` inside the extension folder
2. Find the line:
javascript
const API_KEY = "YOUR_GEMINI_API_KEY" 
3. Replace `"YOUR_GEMINI_API_KEY"` with your actual API key from Gemini
4. Save the file

> 📌 Example: const API_KEY ="AIzaSyA..."

---

## 💡 How to Use the Extension

1. Open any website (e.g., https://example.com)
2. Click the **XPath AI Generator** extension icon
3. Click the **"Generate XPath"** button
4. The extension will:
   - Capture the page HTML
   - Send it to Gemini
   - Show XPath locators in the popup window

---

## ✅ Sample Output


Generated XPath:
- //input[@name='email']
- //button[contains(text(),'Submit')]
- //a[contains(text(),'Learn More')]


---

## 🧩 Troubleshooting

|-----------------------------|----------------------------------------------------|
| Issue                       | Solution                                           |
|-----------------------------|----------------------------------------------------|
| API Error: Unauthorized     | Double-check if your Gemini API key is correct     |
| "No response from API"      | Check network or simplify the HTML being processed |
| Extension not visible       | Pin it using the Chrome puzzle icon                |
|-----------------------------|----------------------------------------------------|
---

## 📄 License

MIT License — free to use, share, and modify

---

> ✨ Automate smarter. Let Gemini AI do the XPath work for you!
