#!/bin/bash

# Configuration
APP_NAME="SettHub"
IDENTIFIER="com.sett.hub"
VERSION="1.0.0"
# We install to the system-wide CEP folder so it works for all users
INSTALL_LOCATION="/Library/Application Support/Adobe/CEP/extensions/sett-hub"
OUTPUT_PKG="SettHub_Installer_v${VERSION}.pkg"

echo "🚧 Starting build process for $APP_NAME..."

# Create a temporary staging directory simulating the root filesystem
BUILD_DIR="./build_stage"
echo "📂 Creating staging directory at $BUILD_DIR..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR$INSTALL_LOCATION"

# Copy project files to the staging directory
# We exclude development files like .git, the installer script itself, and previous builds
echo "files copying..."
rsync -av \
  --exclude '.git' \
  --exclude '.gitignore' \
  --exclude 'build_installer.sh' \
  --exclude 'build_stage' \
  --exclude '*.pkg' \
  --exclude '.DS_Store' \
  --exclude 'node_modules' \
  --exclude 'CSXS/manifest.xml' \
  . "$BUILD_DIR$INSTALL_LOCATION"

# Copy main manifest separately to ensure it is handled correctly if needed, 
# though rsync above would catch it unless excluded. 
# actually, why exclude manifest? re-checking rsync command.
# I shouldn't exclude manifest. Fixing exclusion list in next 'write' if I made a mistake, 
# but let's correct it in the file content now.
# Wait, let's keep it simple. Just exclude the build artifacts.

# Re-defining the rsync to be safe and simple
rsync -a \
  --exclude '.git*' \
  --exclude 'build_installer.sh' \
  --exclude 'build_stage' \
  --exclude '*.pkg' \
  --exclude '.DS_Store' \
  --exclude 'tmp' \
  . "$BUILD_DIR$INSTALL_LOCATION"


echo "📦 Running pkgbuild..."
# Build the component package
# usage: pkgbuild --root <content> --identifier <id> --version <ver> --install-location <path> <output>
# BUT since we constructed the full path in BUILD_DIR, we set install-location to "/"
pkgbuild --root "$BUILD_DIR" \
         --identifier "$IDENTIFIER" \
         --version "$VERSION" \
         --install-location "/" \
         "$OUTPUT_PKG"

echo "🧹 Cleaning up temporary files..."
rm -rf "$BUILD_DIR"

echo "✅ Build Complete!"
echo "Generated Installer: $OUTPUT_PKG"
echo "You can send this .pkg file to other Macs to install the extension."
