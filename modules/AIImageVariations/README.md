# AI Image Variations 🎨

A stunning web application that uses **Google Gemini AI** and **Imagen 4.0** to analyze uploaded images and generate 4 unique variations with customizable controls.

![AI Image Variations](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-blue?style=for-the-badge)
![Image Generation](https://img.shields.io/badge/Images-Imagen%204.0-purple?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## ✨ Features

- 🎨 **AI-Powered Analysis** - Deep image analysis using Gemini 2.5 Flash
- 🖼️ **Real Image Generation** - Creates actual visual variations using Imagen 4.0
- 🎛️ **Customizable Controls** - Toggle switches to control colors and composition
- 📐 **Aspect Ratio Preservation** - Maintains original image proportions
- 📥 **Download Variations** - One-click download for all generated images
- 🎭 **Premium UI** - Dark theme with glassmorphism and smooth animations
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- 🔒 **Privacy First** - API key stored locally, no server storage

## 🚀 Quick Start

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-image-variations.git
   cd ai-image-variations
   ```

2. **Open in browser**
   - Simply open `index.html` in your browser, or
   - Use a local server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js
   npx http-server -p 8000
   ```

3. **Enter your API key** and start creating!

## 🎯 How to Use

1. **Enter your Gemini API key** (saved securely in browser)
2. **Upload an image** (any aspect ratio supported)
3. **Review the AI analysis** of your image
4. **Adjust settings** with toggle switches:
   - 🎨 **Keep Original Colors** - Maintain color palette
   - 📐 **Keep Composition** - Maintain subjects and layout
5. **Generate Variations** - Get 4 unique AI-generated images
6. **Download** your favorites with one click

## 🎨 Variation Modes

Based on your toggle settings, you get different types of variations:

| Keep Colors | Keep Composition | Result |
|-------------|------------------|--------|
| ✅ | ✅ | **Lighting variations** - Same image, different lighting/mood |
| ✅ | ❌ | **Shape variations** - Same colors, different compositions |
| ❌ | ✅ | **Color variations** - Same layout, different color palettes |
| ❌ | ❌ | **Full creative freedom** - Different styles, colors, and compositions |

### Example Variations (Composition ON, Colors OFF)
- 🌅 **Warm Sunset Vibes** - Golden yellows, oranges, warm reds
- 🌊 **Cool Ocean Tones** - Deep blues, turquoise, seafoam greens
- ⚡ **Vibrant Neon Energy** - Electric pinks, bright cyans, vivid purples
- ⚫ **Monochrome Elegance** - Rich blacks, pure whites, elegant grays

## 🛠️ Technical Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (no frameworks!)
- **AI Analysis**: Gemini 2.5 Flash
- **Image Generation**: Imagen 4.0
- **Storage**: LocalStorage for API key
- **Styling**: Custom CSS with modern design patterns

## 📁 Project Structure

```
ai-image-variations/
├── index.html          # Main HTML structure
├── styles.css          # Premium dark theme styles
├── app.js             # Application logic & API integration
├── README.md          # This file
└── .gitignore         # Git ignore rules
```

## 🔐 Privacy & Security

- ✅ API key stored only in browser's localStorage
- ✅ Images processed client-side
- ✅ Direct API calls to Google (no intermediary servers)
- ✅ No data persistence or tracking
- ✅ Open source - audit the code yourself!

## 🌐 Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome/Edge | ✅ Full support |
| Firefox | ✅ Full support |
| Safari | ✅ Full support |
| Mobile browsers | ✅ Responsive design |

## 📝 License

MIT License - feel free to use, modify, and distribute!

## 🙏 Credits

- Powered by [Google Gemini AI](https://ai.google.dev/)
- Image generation by [Imagen 4.0](https://ai.google.dev/gemini-api/docs/imagen)
- Built with ❤️ using vanilla JavaScript

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## ⭐ Show Your Support

If you find this project useful, please consider giving it a star on GitHub!

---

**Note**: You'll need your own Gemini API key to use this application. Get one for free at [Google AI Studio](https://makersuite.google.com/app/apikey).

## 🎬 After Effects Integration

This app can now be installed as an Adobe After Effects extension!

### Installation

1. **Copy the folder** to your Adobe extensions directory:
   - **Mac**: `/Library/Application Support/Adobe/CEP/extensions/`
   - **Windows**: `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\`

2. **Enable Debug Mode** (required for unsigned extensions):
   - **Mac**: Open Terminal and run:
     ```bash
     defaults write com.adobe.CSXS.11 PlayerDebugMode 1
     ```
   - **Windows**: Open Registry Editor (`regedit`), go to `HKEY_CURRENT_USER\Software\Adobe\CSXS.11`, and add a String value named `PlayerDebugMode` with value `1`.

3. **Restart After Effects**

4. **Open the Panel**:
   - Go to **Window** > **Extensions** > **AI Image Variations**

### Features in After Effects
- 📥 **Import to AE**: New button appears on variation cards
- 📁 **Auto-Import**: Automatically saves the image and imports it into your project
- 🎞️ **Comp Integration**: Adds the image to your active composition if one is open
