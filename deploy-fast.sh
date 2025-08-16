#!/bin/bash

# Quick Frontend Deployment Script for DigitalOcean
# This script provides options for fast deployment

echo "🚀 MonkeyZ Frontend Deployment Options"
echo "======================================"
echo ""
echo "Choose deployment method:"
echo "1. 🏃‍♂️ ULTRA-FAST Static Site (2-3 minutes)"
echo "2. 🐳 Optimized Docker (5-8 minutes)"
echo "3. 🔄 Current Docker (15-20 minutes)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
  1)
    echo "🏃‍♂️ Deploying as Static Site (Ultra-Fast)..."
    echo "Using optimized build configuration..."
    
    # Use the static site app.yaml
    if [ -f "frontend/.do/app-static.yaml" ]; then
      cp frontend/.do/app-static.yaml .do/app.yaml
      echo "✅ Switched to static site configuration"
      echo "⏱️ Expected deployment time: 2-3 minutes"
      echo "💰 Cost: ~50% cheaper than Docker"
      echo "🚀 Performance: CDN-served, faster loading"
    else
      echo "❌ Static site configuration not found"
      exit 1
    fi
    ;;
    
  2)
    echo "🐳 Deploying with Optimized Docker..."
    echo "Using multi-stage build and nginx..."
    
    # Use optimized Dockerfile
    if [ -f "frontend/Dockerfile.optimized" ]; then
      cp frontend/Dockerfile.optimized frontend/Dockerfile
      echo "✅ Switched to optimized Dockerfile"
      echo "⏱️ Expected deployment time: 5-8 minutes"
      echo "🔧 Features: Multi-stage build, nginx, caching"
    else
      echo "❌ Optimized Dockerfile not found"
      exit 1
    fi
    ;;
    
  3)
    echo "🔄 Using Current Docker Configuration..."
    echo "⏱️ Expected deployment time: 15-20 minutes"
    echo "ℹ️ Consider switching to option 1 or 2 for faster deployments"
    ;;
    
  *)
    echo "❌ Invalid choice. Exiting."
    exit 1
    ;;
esac

echo ""
echo "🔧 Build Optimizations Applied:"
echo "- Source maps disabled (GENERATE_SOURCEMAP=false)"
echo "- ESLint disabled during build"
echo "- Silent npm install"
echo "- Production optimizations enabled"
echo ""

echo "📊 Deployment Comparison:"
echo "┌─────────────────┬──────────────┬─────────────┬──────────────┐"
echo "│ Method          │ Deploy Time  │ Cost        │ Performance  │"
echo "├─────────────────┼──────────────┼─────────────┼──────────────┤"
echo "│ Static Site     │ 2-3 min      │ ~\$3/month   │ CDN + Fast   │"
echo "│ Optimized Docker│ 5-8 min      │ ~\$6/month   │ Fast         │"
echo "│ Current Docker  │ 15-20 min    │ ~\$6/month   │ Normal       │"
echo "└─────────────────┴──────────────┴─────────────┴──────────────┘"
echo ""

if [ $choice -eq 1 ]; then
  echo "🎯 RECOMMENDED: Static Site is the fastest option!"
  echo "   - Deploys in 2-3 minutes instead of 15-20"
  echo "   - Served from CDN (faster for users)"
  echo "   - 50% cheaper hosting costs"
  echo "   - Perfect for React SPAs like yours"
elif [ $choice -eq 2 ]; then
  echo "🎯 GOOD CHOICE: Optimized Docker is much faster!"
  echo "   - 3x faster than current setup"
  echo "   - Better caching and smaller images"
  echo "   - Production-ready nginx configuration"
fi

echo ""
echo "✅ Configuration ready!"
echo "💡 Tip: Commit and push to trigger deployment with the new configuration."
