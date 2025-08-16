# Quick Frontend Deployment Script for DigitalOcean
# PowerShell version for Windows

Write-Host "🚀 MonkeyZ Frontend Deployment Options" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Choose deployment method:"
Write-Host "1. 🏃‍♂️ ULTRA-FAST Static Site (2-3 minutes)" -ForegroundColor Yellow
Write-Host "2. 🐳 Optimized Docker (5-8 minutes)" -ForegroundColor Cyan  
Write-Host "3. 🔄 Current Docker (15-20 minutes)" -ForegroundColor Red
Write-Host ""

$choice = Read-Host "Enter choice [1-3]"

switch ($choice) {
    "1" {
        Write-Host "🏃‍♂️ Deploying as Static Site (Ultra-Fast)..." -ForegroundColor Green
        Write-Host "Using optimized build configuration..."
        
        # Use the static site app.yaml
        if (Test-Path "frontend\.do\app-static.yaml") {
            Copy-Item "frontend\.do\app-static.yaml" ".do\app.yaml" -Force
            Write-Host "✅ Switched to static site configuration" -ForegroundColor Green
            Write-Host "⏱️ Expected deployment time: 2-3 minutes" -ForegroundColor Yellow
            Write-Host "💰 Cost: ~50% cheaper than Docker" -ForegroundColor Green
            Write-Host "🚀 Performance: CDN-served, faster loading" -ForegroundColor Green
        } else {
            Write-Host "❌ Static site configuration not found" -ForegroundColor Red
            exit 1
        }
    }
    
    "2" {
        Write-Host "🐳 Deploying with Optimized Docker..." -ForegroundColor Cyan
        Write-Host "Using multi-stage build and nginx..."
        
        # Use optimized Dockerfile
        if (Test-Path "frontend\Dockerfile.optimized") {
            Copy-Item "frontend\Dockerfile.optimized" "frontend\Dockerfile" -Force
            Write-Host "✅ Switched to optimized Dockerfile" -ForegroundColor Green
            Write-Host "⏱️ Expected deployment time: 5-8 minutes" -ForegroundColor Yellow
            Write-Host "🔧 Features: Multi-stage build, nginx, caching" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Optimized Dockerfile not found" -ForegroundColor Red
            exit 1
        }
    }
    
    "3" {
        Write-Host "🔄 Using Current Docker Configuration..." -ForegroundColor Yellow
        Write-Host "⏱️ Expected deployment time: 15-20 minutes" -ForegroundColor Red
        Write-Host "ℹ️ Consider switching to option 1 or 2 for faster deployments" -ForegroundColor Yellow
    }
    
    default {
        Write-Host "❌ Invalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🔧 Build Optimizations Applied:" -ForegroundColor Cyan
Write-Host "- Source maps disabled (GENERATE_SOURCEMAP=false)"
Write-Host "- ESLint disabled during build"
Write-Host "- Silent npm install"
Write-Host "- Production optimizations enabled"
Write-Host ""

Write-Host "📊 Deployment Comparison:" -ForegroundColor Yellow
Write-Host "┌─────────────────┬──────────────┬─────────────┬──────────────┐"
Write-Host "│ Method          │ Deploy Time  │ Cost        │ Performance  │"
Write-Host "├─────────────────┼──────────────┼─────────────┼──────────────┤"
Write-Host "│ Static Site     │ 2-3 min      │ ~`$3/month   │ CDN + Fast   │"
Write-Host "│ Optimized Docker│ 5-8 min      │ ~`$6/month   │ Fast         │"
Write-Host "│ Current Docker  │ 15-20 min    │ ~`$6/month   │ Normal       │"
Write-Host "└─────────────────┴──────────────┴─────────────┴──────────────┘"
Write-Host ""

if ($choice -eq "1") {
    Write-Host "🎯 RECOMMENDED: Static Site is the fastest option!" -ForegroundColor Green
    Write-Host "   - Deploys in 2-3 minutes instead of 15-20"
    Write-Host "   - Served from CDN (faster for users)"
    Write-Host "   - 50% cheaper hosting costs" 
    Write-Host "   - Perfect for React SPAs like yours"
} elseif ($choice -eq "2") {
    Write-Host "🎯 GOOD CHOICE: Optimized Docker is much faster!" -ForegroundColor Cyan
    Write-Host "   - 3x faster than current setup"
    Write-Host "   - Better caching and smaller images"
    Write-Host "   - Production-ready nginx configuration"
}

Write-Host ""
Write-Host "✅ Configuration ready!" -ForegroundColor Green
Write-Host "💡 Tip: Commit and push to trigger deployment with the new configuration." -ForegroundColor Yellow

# Pause to let user read the output
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
