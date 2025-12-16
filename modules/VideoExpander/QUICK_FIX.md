# Quick Fix Guide

## The Issue

Your screenshot shows **"Shape Layer 1"** selected. This is a **shape layer**, not a video footage layer.

The extension only works with:
- ✅ **Video footage** layers (imported video files like .mp4, .mov)
- ✅ **Image sequence** layers
- ❌ **NOT** shape layers, text layers, or adjustment layers

## How to Test

1. **Import a video file:**
   - In After Effects: `File → Import → File...`
   - Select a video file (.mp4, .mov, etc.)

2. **Drag it to your timeline:**
   - Drag the imported footage into your composition

3. **Select the video layer:**
   - Click on the video layer in the timeline (not the shape layer)

4. **Click "Refresh Selection"** in the extension

## After Restarting AE

Since I just fixed the ExtendScript loading:

1. **Quit After Effects completely**
2. **Relaunch After Effects**
3. **Open the extension:** `Window → Extensions → Video Expander`
4. **Open Chrome DevTools:** Navigate to `http://localhost:8092`
5. **Try again with a VIDEO layer**

You should now see proper error messages telling you exactly what's wrong!
