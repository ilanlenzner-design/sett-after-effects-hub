# 🐛 Video Expander - Debugging Guide

## Selected Layer Not Working - Fixes Applied

I've updated the extension to provide better error messages. Here's what changed:

### Changes Made

1. **Enhanced Error Reporting** - The ExtendScript now returns detailed JSON error objects instead of just `null`
2. **Better UI Feedback** - Error messages now display in the layer info panel
3. **Console Logging** - Added detailed logging to help debug issues

### How to Debug

#### Step 1: Reload the Extension

After the code changes, you need to reload the extension:

**Option A: Restart After Effects** (Recommended)
- Quit After Effects completely
- Relaunch After Effects
- Open the extension: `Window → Extensions → Video Expander`

**Option B: Reload Extension Only**
- Open Chrome DevTools: `http://localhost:8092`
- Find the Video Expander extension in the list
- Click "Reload"

#### Step 2: Check Chrome DevTools

1. Open Chrome browser
2. Navigate to: `http://localhost:8092`
3. Click on "Video Expander" in the list
4. Open the Console tab
5. Click "Refresh Selection" in the extension
6. Look at the console output - it will show:
   ```
   getSelectedLayer result: {"error": "..."}
   ```

#### Step 3: Common Error Messages

The extension now shows specific error messages:

| Error Message | Meaning | Solution |
|--------------|---------|----------|
| "No active composition" | No composition is open | Create/open a composition |
| "No layer selected" | No layer is selected in the timeline | Click on a layer to select it |
| "Selected layer is not an AV layer" | You selected text/shape/adjustment layer | Select a footage/video layer instead |
| "Layer has no source" | Layer exists but has no source footage | Use a layer with actual video source |

#### Step 4: Verify Layer Type

Make sure you're selecting the **right type of layer**:

✅ **These work:**
- Video footage layer
- Image sequence layer
- Solid layer with video source
- Precomp with video

❌ **These don't work:**
- Text layers
- Shape layers
- Adjustment layers
- Null objects
- Cameras/Lights

### Testing the ExtendScript Directly

To test if ExtendScript is working at all:

1. In After Effects, go to: `File → Scripts → Run Script File...`
2. Navigate to: `/Users/ilan/.gemini/antigravity/scratch/video-expander-ae/jsx/debug.jsx`
3. Click Run
4. You should see two alerts showing the results

### If Still Not Working

#### Check 1: Verify Extension Location

```bash
ls -la ~/Library/Application\ Support/Adobe/CEP/extensions/video-expander-ae
```

Should show a symlink pointing to the extension directory.

#### Check 2: Verify PlayerDebugMode

```bash
defaults read com.adobe.CSXS.9 PlayerDebugMode
defaults read com.adobe.CSXS.10 PlayerDebugMode
defaults read com.adobe.CSXS.11 PlayerDebugMode
```

All should return `1`. If not, run:

```bash
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
```

#### Check 3: Verify Manifest

The manifest should be properly formatted. Check:
```bash
cat /Users/ilan/.gemini/antigravity/scratch/video-expander-ae/CSXS/manifest.xml
```

### What to Look For in Console

When you click "Refresh Selection", you should see in DevTools console:

**If no layer selected:**
```javascript
getSelectedLayer result: {"error":"No layer selected"}
```

**If wrong layer type:**
```javascript
getSelectedLayer result: {"error":"Selected layer is not an AV layer (must be footage, not text/shape/adjustment layer)"}
```

**If correct layer:**
```javascript
getSelectedLayer result: {"name":"video.mp4","startTime":0,"duration":10.5,...}
```

### Still Having Issues?

Try this step-by-step test:
1. Create a new composition in After Effects
2. Import a video file (`File → Import → File...`)
3. Drag the video into the timeline
4. Click on the video layer to select it (it should be highlighted)
5. In the Video Expander panel, click "Refresh Selection"
6. Check the DevTools console for the output

The extension should now show either:
- The layer details if everything works
- A specific error message telling you what's wrong

### Quick Test Checklist

- [ ] After Effects is running
- [ ] Extension appears in Window → Extensions menu
- [ ] Extension panel is open
- [ ] A composition is open
- [ ] A video layer exists in the composition
- [ ] The video layer is selected (highlighted in timeline)
- [ ] Chrome DevTools is open at http://localhost:8092
- [ ] Clicked "Refresh Selection" button
- [ ] Console shows the `getSelectedLayer result:` log

If all checkboxes are checked and it still doesn't work, please share:
1. The exact error message from the UI
2. The console output from DevTools
3. What type of layer you're trying to select
