#!/bin/bash

# Define paths
SOURCE_DIR="/Users/ilan/.gemini/antigravity/scratch/SmartTextCopywriter"
SYSTEM_EXT_DIR="/Library/Application Support/Adobe/CEP/extensions"
SYSTEM_EXT_PATH="$SYSTEM_EXT_DIR/SmartTextCopywriter"

echo "🔧 Starting Foolproof System Installation..."

# 1. Cleanup
if [ -d "$SYSTEM_EXT_PATH" ]; then
    echo "🗑️  Removing existing installation..."
    sudo rm -rf "$SYSTEM_EXT_PATH"
fi

# 2. Copy files
echo "📂 Copying files..."
sudo mkdir -p "$SYSTEM_EXT_DIR"
sudo cp -R "$SOURCE_DIR/" "$SYSTEM_EXT_PATH/"

# 3. Permissions (777 is overkill but useful for debugging if AE can't read it)
echo "🔓 Setting wide permissions..."
sudo chmod -R 777 "$SYSTEM_EXT_PATH"

# 4. Debug Mode - enabling for EVERY version just to be safe
echo "⚙️  Enabling Debug Mode for all CSXS versions..."
for i in {10..24}
do
   defaults write com.adobe.CSXS.$i PlayerDebugMode 1
   sudo defaults write com.adobe.CSXS.$i PlayerDebugMode 1
done

# 5. Kill background processes that might cache extensions
echo "🔄 Restarting preference daemon..."
killall cfprefsd 2>/dev/null

echo "✅ Installed to: $SYSTEM_EXT_PATH"
echo "👉 Please Restart After Effects."
