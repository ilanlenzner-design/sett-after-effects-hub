#!/bin/bash

# Define paths
SOURCE_DIR="/Users/ilan/.gemini/antigravity/scratch/SmartTextCopywriter"
USER_EXT_PATH="$HOME/Library/Application Support/Adobe/CEP/extensions/com.smartcopywriter.cep"
SYSTEM_EXT_DIR="/Library/Application Support/Adobe/CEP/extensions"
SYSTEM_EXT_PATH="$SYSTEM_EXT_DIR/SmartTextCopywriter"

echo "🔧 Starting System-Wide Installation..."

# 1. Cleanup User Level (to avoid conflicts)
if [ -d "$USER_EXT_PATH" ]; then
    echo "🗑️  Removing User-level installation..."
    rm -rf "$USER_EXT_PATH"
fi

# 2. Cleanup existing System Level
if [ -d "$SYSTEM_EXT_PATH" ]; then
    echo "🗑️  Removing existing System-level installation..."
    sudo rm -rf "$SYSTEM_EXT_PATH"
fi

# 3. Copy to System Extensions
echo "📂 Copying to /Library/.../SmartTextCopywriter..."
sudo mkdir -p "$SYSTEM_EXT_DIR"
sudo cp -R "$SOURCE_DIR/" "$SYSTEM_EXT_PATH/"

# 4. Fix Permissions (Crucial for System Level)
echo "🔒 Fixing permissions..."
sudo chmod -R 755 "$SYSTEM_EXT_PATH"

# 5. Refresh Debug Mode
echo "🔓 Refreshing Debug Mode..."
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
defaults write com.adobe.CSXS.13 PlayerDebugMode 1
defaults write com.adobe.CSXS.14 PlayerDebugMode 1
defaults write com.adobe.CSXS.15 PlayerDebugMode 1
defaults write com.adobe.CSXS.16 PlayerDebugMode 1
defaults write com.adobe.CSXS.17 PlayerDebugMode 1

echo "✅ System-Wide Installation Complete!"
echo "👉 Please restart After Effects."
