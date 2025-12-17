#!/bin/bash

# Define paths
SOURCE_DIR="/Users/ilan/.gemini/antigravity/scratch/SmartTextCopywriter"
USER_EXT_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions"
FINAL_PATH="$USER_EXT_DIR/com.smartcopywriter.cep"

echo "🔧 Relocating Extension..."

# 1. Cleanup old symlink/folder
if [ -e "$FINAL_PATH" ] || [ -L "$FINAL_PATH" ]; then
    echo "🗑️  Removing old entry..."
    rm -rf "$FINAL_PATH"
fi

# 2. Copy files DIRECTLY (No Symlink)
# We do this because Adobe apps sometimes fail to read from hidden (.gemini) folders via symlink.
echo "📂 Copying files to extensions directory..."
mkdir -p "$FINAL_PATH"
cp -R "$SOURCE_DIR/" "$FINAL_PATH/"

# 3. Force preference refresh
echo "🔄 Refreshing system preferences..."
killall cfprefsd 2>/dev/null

echo "✅ Copied successfully to: $FINAL_PATH"
echo "👉 Please restart After Effects one more time."
