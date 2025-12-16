# 🎬 Video Expander - After Effects Extension

Transform your videos with AI! This CEP extension uses Gemini and Runway APIs to analyze and creatively expand your video footage.

## Features

- 🎥 **Select video layers** directly from After Effects
- 🤖 **AI-powered analysis** using Google Gemini
- ✨ **Creative transformations** with Runway video generation
- 🔄 **Seamless integration** - import results back into AE
- 🎨 **Premium UI** with real-time status updates

## Installation

### 1. Enable PlayerDebugMode

First, enable CEP debugging:

```bash
# Run this command in Terminal:
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
```

### 2. Install the Extension

Copy the extension folder to the CEP extensions directory:

```bash
# Copy to CEP extensions folder
cp -r /Users/ilan/.gemini/antigravity/scratch/video-expander-ae ~/Library/Application\ Support/Adobe/CEP/extensions/
```

Alternatively, create a symlink:

```bash
# Create extensions directory if it doesn't exist
mkdir -p ~/Library/Application\ Support/Adobe/CEP/extensions/

# Create symlink
ln -s /Users/ilan/.gemini/antigravity/scratch/video-expander-ae ~/Library/Application\ Support/Adobe/CEP/extensions/video-expander-ae
```

### 3. Restart After Effects

Quit and relaunch After Effects.

### 4. Open the Extension

In After Effects, go to:
**Window → Extensions → Video Expander**

## Configuration

### API Keys

You'll need API keys for:

1. **Gemini API** - [Get key from Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Runway API** - [Get key from Runway ML](https://runwayml.com/)

Click the ⚙️ settings button in the extension to enter your API keys.

## Usage

1. **Select a video layer** in your After Effects composition
2. Click **Refresh Selection** to confirm the layer is detected
3. Enter a **style or prompt** (e.g., "cinematic sci-fi style", "vintage film look")
4. Click **✨ Generate Video**
5. Wait for the process to complete (typically 2-5 minutes)
6. Click **Import to After Effects** to add the result to your comp

## How It Works

1. **Video Export** - Extracts the selected layer's source video
2. **AI Analysis** - Gemini analyzes the video and creates a detailed creative prompt
3. **Video Generation** - Runway generates a new video based on the AI prompt
4. **Import** - The generated video is imported back into After Effects

## Debugging

To debug the extension, open Chrome DevTools:

1. Open Chrome browser
2. Navigate to: `http://localhost:8092`
3. View console logs and inspect the extension

## Troubleshooting

**Extension doesn't appear in menu:**
- Make sure PlayerDebugMode is enabled
- Check that the extension is in the correct CEP folder
- Restart After Effects

**API errors:**
- Verify your API keys are correct
- Check your internet connection
- Ensure you have API credits/quota

**Layer not detected:**
- Make sure you've selected a video layer (not a shape, text, or adjustment layer)
- The layer must have a video source file

## Project Structure

```
video-expander-ae/
├── .debug                    # Debug configuration
├── CSXS/
│   └── manifest.xml         # Extension manifest
├── css/
│   └── styles.css          # UI styling
├── js/
│   ├── CSInterface.js      # CEP bridge library
│   ├── config.js           # Configuration management
│   ├── main.js             # Main application logic
│   └── services/
│       ├── geminiService.js  # Gemini API integration
│       └── runwayService.js  # Runway API integration
├── jsx/
│   └── hostscript.jsx      # ExtendScript functions
└── index.html              # Main UI
```

## License

MIT License

## Support

For issues or questions, please open an issue on GitHub.
