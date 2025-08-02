
# XPath AI Generator Extension

A Chrome extension that generates XPath selectors by clicking on elements, powered by **AI**.

## Features

- **🤖 AI-Powered**: Uses AI for intelligent XPath generation
- **🔄 Easy AI Switching**: Change AI providers by just updating the URL in config
- **Click-to-XPath**: Click any element to get its XPath
- **Multiple Element Detection**: Automatically handles duplicate elements with position indexing
- **Visual Feedback**: Highlights clicked elements and shows results on-page
- **Copy to Clipboard**: One-click copying of generated XPaths

## Quick Start

### 1. Get AI API Key

Get an API key from your preferred AI provider (currently configured for Gemini).

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
2. **Click the extension icon** - should show "✅ AI Enabled: AI API configured"
3. **Click "🔍 Click Mode: OFF" to activate**
4. **Click any element on the page**
5. **Copy the AI-generated XPath**

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
3. **Check AI status** - should show "✅ AI Enabled: AI API configured"
4. **Click "🔍 Click Mode: OFF" to activate**
5. **Click any element on the page**
6. **Copy the AI-generated XPath**

### AI vs Local Generation

- **AI Generation**: Uses your configured AI for intelligent XPath generation
- **Local Generation**: Fallback algorithm that works without API key

