#!/bin/bash
# Digg Button Classic - Build Script
# Packages the extension for Firefox (XPI) and Chrome (ZIP)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Extension info
NAME="digg-button-classic"
VERSION=$(grep '"version"' manifest.json | sed 's/.*: *"\([^"]*\)".*/\1/')

echo "Building ${NAME} v${VERSION}..."
echo ""

# Clean old builds
rm -f "${NAME}"*.xpi "${NAME}"*.zip
rm -rf build/

# Create build directories
mkdir -p build/firefox build/chrome

# ============================================
# Firefox Build (Manifest V2)
# ============================================
echo "Building Firefox version..."

cp manifest.json build/firefox/
cp content.js build/firefox/
cp popup.html build/firefox/
cp popup.js build/firefox/
cp -r icons build/firefox/
cp -r themes build/firefox/

cd build/firefox
zip -r "../../${NAME}-${VERSION}-firefox.xpi" . -x "*.svg"
cd ../..

# ============================================
# Chrome Build (Manifest V3)
# ============================================
echo "Building Chrome version..."

cp manifest.chrome.json build/chrome/manifest.json
cp content.chrome.js build/chrome/content.js
cp popup.chrome.js build/chrome/popup.js
cp popup.html build/chrome/
cp -r icons build/chrome/
cp -r themes build/chrome/

# Fix popup.html to use popup.js (not popup.chrome.js)
# (it's the same file, just renamed)

cd build/chrome
zip -r "../../${NAME}-${VERSION}-chrome.zip" . -x "*.svg"
cd ../..

# Clean up temp build folder
rm -rf build/

# ============================================
# Update chrome/ dev folder
# ============================================
echo "Updating chrome/ dev folder..."
rm -rf chrome/
mkdir -p chrome
cp manifest.chrome.json chrome/manifest.json
cp content.chrome.js chrome/content.js
cp popup.chrome.js chrome/popup.js
cp popup.html chrome/
cp -r icons chrome/
cp -r themes chrome/

echo ""
echo "============================================"
echo " Build complete!"
echo "============================================"
echo ""
echo " Firefox: ${NAME}-${VERSION}-firefox.xpi ($(du -h "${NAME}-${VERSION}-firefox.xpi" | cut -f1))"
echo " Chrome:  ${NAME}-${VERSION}-chrome.zip ($(du -h "${NAME}-${VERSION}-chrome.zip" | cut -f1))"
echo ""
echo " Firefox install:"
echo "   about:addons > gear > Install Add-on From File"
echo ""
echo " Chrome install:"
echo "   chrome://extensions > Developer mode > Load unpacked"
echo "   (or drag the zip to extensions page)"
echo ""
echo " Submit to stores:"
echo "   Firefox: https://addons.mozilla.org/developers/"
echo "   Chrome:  https://chrome.google.com/webstore/devconsole"
echo ""
