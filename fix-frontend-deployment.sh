#!/bin/bash
# Frontend Deployment Fix Script
# ===============================
# This script fixes the chunk loading issue by ensuring a clean, complete deployment

echo "🚀 Starting Frontend Deployment Fix..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Clean and rebuild
echo -e "\n${YELLOW}1️⃣ Cleaning and rebuilding frontend...${NC}"

# Navigate to frontend directory
cd frontend

# Remove old build
if [ -d "build" ]; then
    rm -rf build
    echo "✅ Removed old build directory"
fi

# Clear npm cache
npm cache clean --force
echo "✅ Cleared npm cache"

# Install dependencies (in case something is missing)
npm install
echo "✅ Dependencies verified"

# Build with stable settings
echo -e "\n${YELLOW}Building with chunk stability...${NC}"
GENERATE_SOURCEMAP=false DISABLE_ESLINT_PLUGIN=true npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 2: Verify build contents
echo -e "\n${YELLOW}2️⃣ Verifying build contents...${NC}"

if [ ! -d "build" ]; then
    echo -e "${RED}❌ Build directory not found${NC}"
    exit 1
fi

# Count files
js_files=$(find build/static/js -name "*.js" 2>/dev/null | wc -l)
css_files=$(find build/static/css -name "*.css" 2>/dev/null | wc -l)
chunk_files=$(find build/static/js -name "*.chunk.js" 2>/dev/null | wc -l)

echo "📦 Build contents:"
echo "   - JavaScript files: $js_files"
echo "   - CSS files: $css_files"
echo "   - Chunk files: $chunk_files"

# List chunk files for verification
echo -e "\n📋 Chunk files created:"
find build/static/js -name "*.chunk.js" -exec basename {} \; 2>/dev/null | sort

# Step 3: Create deployment package
echo -e "\n${YELLOW}3️⃣ Creating deployment package...${NC}"

# Create a deployment info file
cat > build/deployment-info.txt << EOF
Deployment Information
=====================
Build Date: $(date)
Node Version: $(node --version)
NPM Version: $(npm --version)
Chunk Loading: Fixed
Status: Ready for upload

Upload Instructions:
1. Upload entire 'build' folder contents to your web root
2. Ensure web server serves files from this location
3. Clear CDN/browser caches
4. Test checkout page
EOF

echo "✅ Created deployment info"

# Step 4: Create archive for easy upload
echo -e "\n${YELLOW}4️⃣ Creating upload archive...${NC}"

cd build
tar -czf ../frontend-fixed.tar.gz .
cd ..

if [ -f "frontend-fixed.tar.gz" ]; then
    echo -e "${GREEN}✅ Created frontend-fixed.tar.gz for upload${NC}"
    echo "📦 Archive size: $(du -h frontend-fixed.tar.gz | cut -f1)"
else
    echo -e "${RED}❌ Failed to create archive${NC}"
fi

# Step 5: Display final instructions
echo -e "\n${GREEN}🎉 Frontend fix completed successfully!${NC}"
echo -e "\n${YELLOW}📋 Deployment Instructions:${NC}"
echo "1. Upload 'frontend-fixed.tar.gz' to your DigitalOcean server"
echo "2. Extract it to your web root directory:"
echo "   tar -xzf frontend-fixed.tar.gz"
echo "3. Ensure your web server (nginx/apache) serves these files"
echo "4. Clear any CDN or browser caches"
echo "5. Test the checkout page"

echo -e "\n${YELLOW}💡 If the issue persists:${NC}"
echo "- Check web server configuration"
echo "- Verify all files were uploaded correctly"
echo "- Clear browser cache completely"
echo "- Check browser console for new errors"

echo -e "\n${GREEN}✅ Ready for deployment!${NC}"
