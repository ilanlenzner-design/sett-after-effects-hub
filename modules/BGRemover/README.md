# BG Remover - After Effects Extension

A CEP extension for After Effects that removes backgrounds from images using Replicate's Bria AI model.

## Features
- **Smart Selection**: Select an image from the **Timeline** (Active Composition) OR directly from the **Project Panel**.
- **One-Click Removal**: Uses Replicate's `cjwbw/rembg` model for state-of-the-art background removal.
- **Instant Import**: Automatically imports the processed transparent PNG back into After Effects.
- **Secure**: Your API key is stored locally in your browser/extension storage.

## Installation

### Method 1: Copy to Extensions Folder

1. **Copy the extension folder:**
   ```bash
   cp -R /Users/ilan/.gemini/antigravity/scratch/bg-remover ~/Library/Application\ Support/Adobe/CEP/extensions/
   ```

2. **Enable PlayerDebugMode** (if not already enabled):
   ```bash
   defaults write com.adobe.CSXS.9 PlayerDebugMode 1
   defaults write com.adobe.CSXS.10 PlayerDebugMode 1
   defaults write com.adobe.CSXS.11 PlayerDebugMode 1
   ```

3. **Restart After Effects**

4. **Open the extension:**
   - Go to: `Window > Extensions > BG Remover`

### Method 2: Symlink (Recommended for development)

```bash
ln -s /Users/ilan/.gemini/antigravity/scratch/bg-remover ~/Library/Application\ Support/Adobe/CEP/extensions/bg-remover
```

## Usage

### 1. Get Replicate API Key

1. Go to [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
2. Sign in or create an account
3. Create a new API token
4. Copy your API key (starts with `r8_`)

### 2. Configure the Extension

1. In After Effects, open the extension: **Window > Extensions > BG Remover**
2. Click the ⚙️ **settings** icon
3. Paste your Replicate API key
4. Click **"Save Settings"**

### 3. Remove Background

1. **Select a Layer:**
   - In After Effects, select the layer you want to process
   - Click **"Get Selected Layer"** in the extension
   - Preview will show the layer content

2. **Process:**
   - Click **"Remove Background"**
   - Wait for processing (usually 5-15 seconds)
   - The extension will create a prediction, poll for results, and download the output
   - Preview will show the result with transparent background

3. **Import:**
   - Click **"Import to After Effects"**
   - The processed image will be added to your composition

## API Model

The extension uses **Bria RMBG 2.0** via Replicate:
- **Model**: [bria/remove-background](https://replicate.com/bria/remove-background)
- **Version**: `e2c4e39fd7f646455c48ec6b33554e37fdacdab3e32fbbfda4f17f40dd1b45f3`
- **Features**:
  - Professional-quality background removal
  - 256 levels of transparency (non-binary masks)
  - Natural, seamless edges
  - Trained on licensed data for commercial use
  - State-of-the-art performance

### Pricing

Replicate charges per prediction. Check current pricing at [replicate.com/bria/remove-background](https://replicate.com/bria/remove-background)

## Debugging

1. **Enable Remote Debugging:**
   - The extension already includes `.debug` file
   - After opening the extension in AE, visit:
     ```
     http://localhost:8092
     ```
   - Click on the extension to open Chrome DevTools

2. **Check Console:**
   - All errors and logs will appear in the DevTools console

## File Structure

```
bg-remover/
├── CSXS/
│   └── manifest.xml       # Extension configuration
├── css/
│   └── styles.css         # After Effects theme styling
├── js/
│   ├── CSInterface.js     # Adobe CEP library
│   └── main.js            # Frontend logic
├── .debug                 # Debug configuration
├── index.html             # Main UI
├── hostscript.jsx         # ExtendScript functions
└── README.md              # This file
```

## Troubleshooting

### Extension doesn't appear in After Effects
- Make sure PlayerDebugMode is enabled
- Restart After Effects completely
- Check that the extension is in the correct folder

### "No active composition" error
- Create or open a composition before using the extension
- The extension will auto-create a composition when importing if needed

### API connection fails
- Check your internet connection
- Verify the API endpoint URL in settings
- Check DevTools console for detailed error messages

### Layer export fails
- Make sure the layer has visible content
- Try rendering the layer first to check if it's valid

## Development

To modify the extension:

1. Edit the files in `/Users/ilan/.gemini/antigravity/scratch/bg-remover`
2. Reload the extension in After Effects:
   - Close and reopen the panel, or
   - Restart After Effects

## Technical Details

- **CEP Version**: 9.0+
- **After Effects**: CC 2019+
- **Framework**: Vanilla JavaScript
- **Styling**: Native After Effects theme
- **Image Format**: PNG with transparency

## License

© 2025 Sett.ai

---

**Need help?** Check the DevTools console for detailed error messages.
