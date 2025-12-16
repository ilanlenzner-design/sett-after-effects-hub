#!/bin/bash

# AI Image Variations Extension Packager
# Creates a macOS .pkg installer for the Adobe CEP extension

# Extension metadata
EXTENSION_NAME="AIImageVariations"
EXTENSION_ID="com.ilanlenzner.aiImageVariations"
EXTENSION_VERSION="1.0.0"
INSTALL_LOCATION="/Library/Application Support/Adobe/CEP/extensions/AIImageVariations"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Build directories
BUILD_DIR="${SCRIPT_DIR}/build"
PKG_ROOT="${BUILD_DIR}/root"
PKG_SCRIPTS="${BUILD_DIR}/scripts"
COMPONENT_PKG="${BUILD_DIR}/${EXTENSION_NAME}-component.pkg"
FINAL_PKG="${SCRIPT_DIR}/${EXTENSION_NAME}-${EXTENSION_VERSION}.pkg"

echo "================================================"
echo "AI Image Variations Extension Packager"
echo "================================================"
echo "Extension: ${EXTENSION_NAME}"
echo "Version: ${EXTENSION_VERSION}"
echo "Bundle ID: ${EXTENSION_ID}"
echo "================================================"
echo ""

# Clean up any previous build
if [ -d "${BUILD_DIR}" ]; then
    echo "🧹 Cleaning previous build..."
    rm -rf "${BUILD_DIR}"
fi

# Create build directory structure
echo "📁 Creating build directory..."
mkdir -p "${PKG_ROOT}${INSTALL_LOCATION}"
mkdir -p "${PKG_SCRIPTS}"

# Copy extension files to package root
echo "📦 Copying extension files..."
cp -R "${SCRIPT_DIR}/CSXS" "${PKG_ROOT}${INSTALL_LOCATION}/"
cp -R "${SCRIPT_DIR}/css" "${PKG_ROOT}${INSTALL_LOCATION}/"
cp -R "${SCRIPT_DIR}/js" "${PKG_ROOT}${INSTALL_LOCATION}/"
cp -R "${SCRIPT_DIR}/jsx" "${PKG_ROOT}${INSTALL_LOCATION}/"
cp "${SCRIPT_DIR}/index.html" "${PKG_ROOT}${INSTALL_LOCATION}/"
cp "${SCRIPT_DIR}/.debug" "${PKG_ROOT}${INSTALL_LOCATION}/"

echo "✅ Extension files copied successfully"

# Create component package
echo "🔨 Building component package..."
pkgbuild --root "${PKG_ROOT}" \
         --identifier "${EXTENSION_ID}" \
         --version "${EXTENSION_VERSION}" \
         --install-location "/" \
         "${COMPONENT_PKG}"

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to create component package"
    exit 1
fi

echo "✅ Component package created"

# Create distribution XML
DISTRIBUTION_XML="${BUILD_DIR}/distribution.xml"
cat > "${DISTRIBUTION_XML}" <<EOF
<?xml version="1.0" encoding="utf-8"?>
<installer-gui-script minSpecVersion="1">
    <title>AI Image Variations ${EXTENSION_VERSION}</title>
    <organization>com.ilanlenzner</organization>
    <domains enable_localSystem="true"/>
    <options customize="never" require-scripts="false" hostArchitectures="x86_64,arm64"/>
    <welcome file="welcome.html" mime-type="text/html"/>
    <license file="license.txt" mime-type="text/plain"/>
    <conclusion file="conclusion.html" mime-type="text/html"/>
    <pkg-ref id="${EXTENSION_ID}"/>
    <options customize="never" require-scripts="false"/>
    <choices-outline>
        <line choice="default">
            <line choice="${EXTENSION_ID}"/>
        </line>
    </choices-outline>
    <choice id="default"/>
    <choice id="${EXTENSION_ID}" visible="false">
        <pkg-ref id="${EXTENSION_ID}"/>
    </choice>
    <pkg-ref id="${EXTENSION_ID}" version="${EXTENSION_VERSION}" onConclusion="none">${EXTENSION_NAME}-component.pkg</pkg-ref>
</installer-gui-script>
EOF

# Create welcome message
cat > "${BUILD_DIR}/welcome.html" <<EOF
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>AI Image Variations Extension</h1>
    <p>This installer will install the AI Image Variations extension for Adobe After Effects.</p>
    <p><strong>Version:</strong> ${EXTENSION_VERSION}</p>
    <p>The extension will be installed to:</p>
    <p><code>${INSTALL_LOCATION}</code></p>
</body>
</html>
EOF

# Create license file
cat > "${BUILD_DIR}/license.txt" <<EOF
AI Image Variations Extension
Copyright © 2024 Ilan Lenzner

This software is provided "as is", without warranty of any kind.
EOF

# Create conclusion message
cat > "${BUILD_DIR}/conclusion.html" <<EOF
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
        h1 { color: #28a745; }
    </style>
</head>
<body>
    <h1>Installation Complete!</h1>
    <p>The AI Image Variations extension has been successfully installed.</p>
    <p><strong>Next Steps:</strong></p>
    <ol>
        <li>Launch Adobe After Effects</li>
        <li>Go to <strong>Window → Extensions → AI Image Variations</strong></li>
        <li>Enter your Replicate API key to start generating variations</li>
    </ol>
    <p>Enjoy creating amazing image variations!</p>
</body>
</html>
EOF

# Create final distribution package
echo "🔨 Building final installer package..."
productbuild --distribution "${DISTRIBUTION_XML}" \
             --package-path "${BUILD_DIR}" \
             --resources "${BUILD_DIR}" \
             "${FINAL_PKG}"

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to create final package"
    exit 1
fi

echo "✅ Final package created"

# Clean up build directory
echo "🧹 Cleaning up temporary files..."
rm -rf "${BUILD_DIR}"

# Display success message
echo ""
echo "================================================"
echo "✨ Success! Package created successfully!"
echo "================================================"
echo "Package location: ${FINAL_PKG}"
echo "Package size: $(du -h "${FINAL_PKG}" | cut -f1)"
echo ""
echo "You can now distribute this .pkg file to install"
echo "the extension on other Macs."
echo "================================================"
