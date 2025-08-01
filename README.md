
# XPath AI Generator Extension

A Chrome extension that generates XPath selectors by clicking on elements.

## Features

- **Click-to-XPath**: Click any element to get its XPath
- **Smart XPath Generation**: Uses intelligent algorithms to generate reliable XPaths
- **Multiple Element Detection**: Automatically handles duplicate elements with position indexing
- **Visual Feedback**: Highlights clicked elements and shows results on-page
- **Copy to Clipboard**: One-click copying of generated XPaths

## Setup

### 1. Install the Extension

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder

## Usage

### Basic Usage

1. **Open any webpage**
2. **Click the extension icon**
3. **Click "🔍 Click Mode: OFF" to activate**
4. **Click any element on the page**
5. **Copy the generated XPath**

### Output Examples

```
//button[text()='Submit']
//input[@placeholder='Search']
//a[contains(@href, '/login')]
//span[text()=' Campaigns ']
(//p[text()='Chat dengan Dokter'])[2]
```

## Features in Detail

### Smart XPath Generation

The extension uses a priority-based system:

1. **ID-based**: `//button[@id='submit-btn']`
2. **Text-based**: `//button[text()='Submit']` (preserves exact whitespace)
3. **Attribute-based**: `//input[@name='email' and @placeholder='Enter email']`
4. **Position-based**: `//div[contains(@class, 'card')]/span[1]`

### Multiple Element Handling

When multiple elements match, the extension automatically adds position indexing:

```xpath
(//button[text()='Submit'])[2]  // Second matching button
(//p[text()='Chat dengan Dokter'])[2]  // Second matching paragraph
```

### Element-Specific Optimization

- **Images**: Uses `src` attribute: `//img[contains(@src, 'arrow-back.svg')]`
- **Links**: Uses `href` attribute: `//a[@href='/kesehatan']`
- **Inputs**: Prioritizes `name`, `type`, `placeholder` attributes
- **Buttons**: Uses `type` or text content

## Troubleshooting

### Extension Not Working

1. **Reload Extension**: Go to `chrome://extensions/` and click refresh
2. **Check Console**: Open DevTools (F12) and check for errors
3. **Refresh Page**: Try refreshing the webpage you're testing on

### XPath Not Accurate

1. **Check Element**: Ensure you're clicking the correct element
2. **Check for Dynamic Content**: Some elements may change dynamically
3. **Try Different Elements**: Some complex elements may need manual adjustment

### Click Mode Not Activating

1. **Check Permissions**: Ensure the extension has access to the current page
2. **Refresh Page**: Some pages may need to be refreshed after loading the extension
3. **Check Console**: Look for any error messages in the browser console

## How It Works

1. **Click Detection**: The extension listens for clicks on the webpage
2. **Element Analysis**: Analyzes the clicked element's attributes, text, and position
3. **XPath Generation**: Uses intelligent algorithms to create the most reliable XPath
4. **Result Display**: Shows the XPath in an on-page panel with copy functionality

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.
