#!/bin/bash

echo "🚀 Testing Wedding Website Build for Netlify..."

# Clean previous builds
rm -rf dist

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo "✅ Build successful! Files created:"
    ls -la dist/
    echo ""
    echo "🎉 Ready for Netlify deployment!"
    echo "📁 Publish directory: dist"
    echo "🏗️  Build command: npm run build"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi
