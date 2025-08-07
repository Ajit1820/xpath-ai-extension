
# XPath & ID Generator Extension

A Chrome extension that automatically generates XPath selectors or returns existing element IDs by clicking on elements, powered by **AI** or local generation.

## Features

- **🆔 Automatic ID Detection**: If an element has an ID, it returns the existing ID
- **🤖 AI-Powered XPath**: Uses AI for intelligent XPath generation when no ID exists
- **🔄 Local Fallback**: Local XPath generation when AI is not available
- **Click-to-Generate**: Click any element to get its ID or XPath
- **Multiple Element Detection**: Automatically handles duplicate elements with position indexing
- **Visual Feedback**: Highlights clicked elements and shows results on-page
- **Copy to Clipboard**: One-click copying of generated XPaths or IDs

## Quick Start

### 1. Get AI API Key (Optional)

Get an API key from your preferred AI provider (currently configured for Gemini) for XPath generation.

### 2. Configure the Extension

1. Open `config.js` in the extension folder
2. Replace `GEMINI_API_KEY` with your actual API key:
   ```javascript
   AI_API_KEY: "your-actual-api-key-here",
   ```

### 3. Install the Extension

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder

### 4. Use the Extension

1. **Open any webpage**
2. **Click the extension icon**
3. **Click "🔍 Click Mode: OFF" to activate**
4. **Click any element on the page**
5. **Get the result**:
   - **If element has ID**: Returns the existing ID
   - **If no ID**: Generates XPath (AI or local)

## How It Works

### Automatic Selection Logic

1. **ID Priority**: If the clicked element has an ID, it returns that ID
2. **XPath Fallback**: If no ID exists, generates an XPath expression
3. **AI vs Local**: Uses AI for XPath generation if configured, otherwise uses local generation

### Examples

#### Elements with IDs
- Click on `<div id="health-utilitiesChat dengan Dokter">` → Returns: `health-utilitiesChat dengan Dokter`
- Click on `<button id="login-btn">` → Returns: `login-btn`

#### Elements without IDs
- Click on `<div>Some text</div>` → Returns: `//div[text()='Some text']`
- Click on `<input placeholder="Search">` → Returns: `//input[@placeholder='Search']`

## Switching AI Providers

The extension is designed to easily switch between different AI providers. Just update these values in `config.js`:

### For Gemini (Current Setup)
```javascript
AI_API_KEY: "your-gemini-api-key",
AI_MODEL: "gemini-2.0-flash",
AI_BASE_URL: "https://generativelanguage.googleapis.com/v1beta/models"
```

### For OpenAI
```javascript
AI_API_KEY: "your-openai-api-key",
AI_MODEL: "gpt-3.5-turbo",
AI_BASE_URL: "https://api.openai.com/v1"
```

### For DeepSeek
```javascript
AI_API_KEY: "your-deepseek-api-key",
AI_MODEL: "deepseek-chat",
AI_BASE_URL: "https://api.deepseek.com/v1"
```

### For Claude
```javascript
AI_API_KEY: "your-claude-api-key",
AI_MODEL: "claude-3-sonnet-20240229",
AI_BASE_URL: "https://api.anthropic.com/v1"
```

## Usage

### Basic Usage

1. **Open any webpage**
2. **Click the extension icon**
3. **Click "🔍 Click Mode: OFF" to activate**
4. **Click any element on the page**
5. **Copy the result** (ID or XPath)

### What You'll Get

- **Elements with IDs**: Returns the existing ID (e.g., `health-utilitiesChat dengan Dokter`)
- **Elements without IDs**: Returns XPath expression (e.g., `//button[text()='Login']`)

### AI vs Local Generation

- **AI Generation**: Intelligent XPath generation with context awareness (when API key is configured)
- **Local Generation**: Reliable fallback using element attributes and position (when no API key)

### Examples

#### ID Examples
- `health-utilitiesChat dengan Dokter`
- `login-btn`
- `search-input`
- `nav-menu`

#### XPath Examples
- `//button[text()='Login']`
- `//input[@placeholder='Search']`
- `(//p[text()='Welcome'])[2]`
- `//div[contains(@class, 'card')]`

