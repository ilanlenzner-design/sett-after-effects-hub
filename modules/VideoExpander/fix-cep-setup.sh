#!/bin/bash

echo "🔧 Video Expander - CEP Setup Fix Script"
echo "=========================================="
echo ""

# Enable PlayerDebugMode for all CSXS versions
echo "1. Enabling PlayerDebugMode for CSXS 8-11..."
defaults write com.adobe.CSXS.8 PlayerDebugMode 1
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1

echo "   ✅ PlayerDebugMode enabled"
echo ""

# Verify settings
echo "2. Verifying PlayerDebugMode settings..."
for version in 8 9 10 11; do
    value=$(defaults read com.adobe.CSXS.$version PlayerDebugMode 2>/dev/null)
    if [ "$value" = "1" ]; then
        echo "   ✅ CSXS.$version = 1"
    else
        echo "   ❌ CSXS.$version = $value (should be 1)"
    fi
done
echo ""

# Check symlink
echo "3. Checking extension installation..."
if [ -L ~/Library/Application\ Support/Adobe/CEP/extensions/video-expander-ae ]; then
    echo "   ✅ Symlink exists"
    target=$(readlink ~/Library/Application\ Support/Adobe/CEP/extensions/video-expander-ae)
    echo "   → Points to: $target"
else
    echo "   ⚠️  Symlink does not exist, creating..."
    ln -sf /Users/ilan/.gemini/antigravity/scratch/video-expander-ae ~/Library/Application\ Support/Adobe/CEP/extensions/video-expander-ae
    echo "   ✅ Symlink created"
fi
echo ""

# Check manifest
echo "4. Checking manifest file..."
manifest="/Users/ilan/.gemini/antigravity/scratch/video-expander-ae/CSXS/manifest.xml"
if [ -f "$manifest" ]; then
    echo "   ✅ Manifest exists"
else
    echo "   ❌ Manifest not found!"
fi
echo ""

# Kill CEF processes (helps reload extensions)
echo "5. Killing CEF processes to force reload..."
killall -9 "CEPHtmlEngine" 2>/dev/null && echo "   ✅ CEPHtmlEngine killed" || echo "   ℹ️  CEPHtmlEngine not running"
echo ""

echo "=========================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Quit After Effects completely"
echo "2. Relaunch After Effects"
echo "3. Go to: Window → Extensions → Video Expander"
echo "4. Click '🧪 Test CEP Connection' button"
echo ""
