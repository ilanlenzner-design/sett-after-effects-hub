#!/bin/bash

# Define paths
SOURCE_DIR="$(pwd)"
USER_EXT_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions"
SYMLINK_PATH="$USER_EXT_DIR/com.smartcopywriter.cep"
SYSTEM_EXT_PATH="/Library/Application Support/Adobe/CEP/extensions/SmartTextCopywriter"

echo "🔧 Starting Smart Copywriter Installation Repair..."

# 1. Create User Extensions directory if it doesn't exist
if [ ! -d "$USER_EXT_DIR" ]; then
    echo "📂 Creating User Extensions directory..."
    mkdir -p "$USER_EXT_DIR"
fi

# 2. Remove existing User symlink or folder if it exists (to ensure clean install)
if [ -e "$SYMLINK_PATH" ] || [ -L "$SYMLINK_PATH" ]; then
    echo "🗑️  Removing existing User extension entry..."
    rm -rf "$SYMLINK_PATH"
fi

# 3. Create the Symlink
echo "🔗 Linking extension to User Library..."
ln -s "$SOURCE_DIR" "$SYMLINK_PATH"

# 4. Check for conflicting System Wide installation and warn
if [ -d "$SYSTEM_EXT_PATH" ]; then
    echo "⚠️  WARNING: Found a copy in the System Library ($SYSTEM_EXT_PATH)."
    echo "   Using the User Library version is recommended."
    echo "   If the extension still doesn't appear, try deleting the folder in /Library/Application Support/..."
fi

# 5. Refresh Debug Mode (Crucial for unsigned extensions)
echo "🔓 Refreshing Debug Mode..."
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
defaults write com.adobe.CSXS.13 PlayerDebugMode 1
defaults write com.adobe.CSXS.14 PlayerDebugMode 1
defaults write com.adobe.CSXS.15 PlayerDebugMode 1
defaults write com.adobe.CSXS.16 PlayerDebugMode 1
defaults write com.adobe.CSXS.17 PlayerDebugMode 1

echo "✅ Installation Repair Complete!"
echo "👉 Please restart After Effects and check 'Window > Extensions > Smart Copywriter'."
