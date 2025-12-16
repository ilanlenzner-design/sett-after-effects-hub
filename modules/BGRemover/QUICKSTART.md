# BG Remover - Quick Start Guide

## 🚀 Setup (5 minutes)

### Step 1: Get Your Replicate API Key

1. Visit: **https://replicate.com/account/api-tokens**
2. Sign in or create a free account
3. Click **"Create token"**
4. Copy your API key (starts with `r8_xxxxx...`)

### Step 2: Restart After Effects

If After Effects is currently open:
- **Quit After Effects completely** (Cmd+Q)
- **Relaunch After Effects**

### Step 3: Open the Extension

1. In After Effects, go to: **Window > Extensions > BG Remover**
2. The panel should appear in your workspace

### Step 4: Configure API Key

1. Click the **⚙️ settings** icon in the extension
2. Paste your Replicate API key
3. Click **"Save Settings"**
4. Click the settings icon again to close the panel

---

## 📝 How to Use

### Remove Background from a Layer

1. **Select a layer** in your composition (must have visual content)

2. In the BG Remover panel, click **"Get Selected Layer"**
   - You'll see a preview of your layer
   - The process button will become active

3. Click **"Remove Background"**
   - Processing takes 5-15 seconds
   - Progress bar shows status:
     - Uploading → Creating prediction → Processing → Downloading

4. Click **"Import to After Effects"**
   - The background-removed image is added to your comp
   - It appears at the center of your composition

---

## 💡 Tips

- **Best Image Types**: Photos, products, people, objects
- **Layer Types**: Works with any layer that has visible pixels
- **Transparency**: Results include 256 levels of transparency for natural edges
- **Cost**: ~$0.01 per image (check Replicate pricing)
- **Speed**: Usually 5-15 seconds per image

---

## 🐛 Troubleshooting

### Extension doesn't appear
- Make sure you **restarted After Effects** after installation
- Check: Window > Extensions > BG Remover

### "No layer selected" error
- Make sure you have a layer selected in the timeline
- The layer must have visible content

### "Please configure Replicate API key"
- Click the ⚙️ icon and enter your API key
- Make sure it starts with `r8_`

### API errors
- Check your Replicate account has credits
- Verify your API key is correct
- Check internet connection

### Open DevTools for debugging
1. Visit: **http://localhost:8092**
2. Click on "BG Remover"
3. Check console for error messages

---

## 📞 Support

- **Replicate Docs**: https://replicate.com/docs
- **Model Page**: https://replicate.com/bria/remove-background
- **DevTools**: http://localhost:8092

---

**Ready to go!** Select a layer and click "Get Selected Layer" to start! 🎬
