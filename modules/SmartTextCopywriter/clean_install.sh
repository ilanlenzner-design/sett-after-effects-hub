#!/bin/bash

# Configuration
EXT_NAME="com.antigravity.smartcopy"
SOURCE_DIR="$(pwd)"
USER_EXT_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions"
TARGET_PATH="$USER_EXT_DIR/$EXT_NAME"
SYSTEM_EXT_PATH="/Library/Application Support/Adobe/CEP/extensions/SmartTextCopywriter"

# 1. CLEANUP PREVIOUS ATTEMPTS
echo "🧹 Cleaning up previous attempts..."
# Remove the old system one we tried
if [ -d "$SYSTEM_EXT_PATH" ]; then
    echo "   Removing system path..."
    echo "idan2004" | sudo -S rm -rf "$SYSTEM_EXT_PATH"
fi
# Remove the old user one
rm -rf "$USER_EXT_DIR/com.smartcopywriter.cep"
rm -rf "$TARGET_PATH"

# 2. CREATE NEW INSTALLATION
echo "📂 Installing '$EXT_NAME' to User Extensions..."
mkdir -p "$TARGET_PATH"
cp -R "$SOURCE_DIR/" "$TARGET_PATH/"

# 3. VERIFY DEBUG MODES
echo "🕵️  Checking Debug Modes..."
# We set them again just to be sure
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
defaults write com.adobe.CSXS.13 PlayerDebugMode 1
defaults write com.adobe.CSXS.14 PlayerDebugMode 1
defaults write com.adobe.CSXS.15 PlayerDebugMode 1
defaults write com.adobe.CSXS.16 PlayerDebugMode 1

echo "------------------------------------------------"
echo "✅ Install Complete."
echo "📂 Location: $TARGET_PATH"
echo "🆔 Bundle ID: $EXT_NAME"
echo "👉 Please Restart After Effects."
