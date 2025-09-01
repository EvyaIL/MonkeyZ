#!/usr/bin/env powershell
# Production Coupon Fix - Quick Deploy Script
# This script will help you deploy the enhanced coupon validation to production

param(
    [string]$ProductionUrl = "",
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Production Coupon Fix Deployment Script

Usage: .\deploy_coupon_fix.ps1 -ProductionUrl 'https://yoursite.com'

This script will:
1. Show you what files need to be uploaded
2. Help you restart the production backend
3. Test the fix in production

Options:
  -ProductionUrl    Your production URL (e.g., https://yoursite.com)
  -Help            Show this help message
"@
    exit 0
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Show-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "===== $Title =====" -ForegroundColor Magenta
}

Show-Header "MonkeyZ Production Coupon Fix Deployment"

Write-ColorOutput "🚀 This script will help you deploy the coupon validation fix" "Cyan"

# Step 1: Check what files were modified
Show-Header "1. Files That Need To Be Uploaded"

$filesToUpload = @(
    "backend/src/services/coupon_service.py",
    "backend/admin_coupon_fix_endpoint.py",
    "debug_coupon_production.py",
    "fix_coupon_production.py"
)

foreach ($file in $filesToUpload) {
    $fullPath = Join-Path $PWD $file
    if (Test-Path $fullPath) {
        Write-ColorOutput "   ✅ $file" "Green"
    } else {
        Write-ColorOutput "   ❌ $file (NOT FOUND)" "Red"
    }
}

Write-ColorOutput ""
Write-ColorOutput "📋 Critical file: backend/src/services/coupon_service.py" "Yellow"
Write-ColorOutput "   This contains the enhanced validation logic that fixes the production bug." "Yellow"

# Step 2: Show deployment commands
Show-Header "2. How to Deploy to Digital Ocean"

Write-ColorOutput "Option A: Using Docker (Recommended)" "Cyan"
Write-ColorOutput "   1. Upload all files to your server" "White"
Write-ColorOutput "   2. Run on your Digital Ocean server:" "White"
Write-ColorOutput "      cd /path/to/your/app" "Gray"
Write-ColorOutput "      docker-compose -f docker-compose.prod.yml down" "Gray"
Write-ColorOutput "      docker-compose -f docker-compose.prod.yml build backend" "Gray"
Write-ColorOutput "      docker-compose -f docker-compose.prod.yml up -d" "Gray"

Write-ColorOutput ""
Write-ColorOutput "Option B: Direct File Upload" "Cyan"
Write-ColorOutput "   1. SCP/SFTP the coupon_service.py to your server:" "White"
Write-ColorOutput "      scp backend/src/services/coupon_service.py user@yourserver:/path/to/backend/src/services/" "Gray"
Write-ColorOutput "   2. Restart your FastAPI backend" "White"

# Step 3: Production Test
Show-Header "3. Testing the Fix"

if ($ProductionUrl) {
    Write-ColorOutput "🧪 Testing production URL: $ProductionUrl" "Cyan"
    
    # Run the Python test script
    Write-ColorOutput "Running production test..." "Yellow"
    
    try {
        & python deploy_production_coupon_fix.py
    } catch {
        Write-ColorOutput "❌ Could not run Python test script" "Red"
        Write-ColorOutput "   Make sure Python is installed and deploy_production_coupon_fix.py exists" "Yellow"
    }
} else {
    Write-ColorOutput "📝 To test the fix, run:" "Cyan"
    Write-ColorOutput "   python deploy_production_coupon_fix.py" "Gray"
    Write-ColorOutput ""
    Write-ColorOutput "   Or manually test your production site:" "White"
    Write-ColorOutput "   1. Try to use the same coupon twice with the same email" "White"  
    Write-ColorOutput "   2. First time should work" "White"
    Write-ColorOutput "   3. Second time should show: 'You have reached the usage limit for this coupon (1/1)'" "White"
}

# Step 4: Summary
Show-Header "4. What This Fix Does"

Write-ColorOutput "🔧 Enhanced Coupon Validation Features:" "Green"
Write-ColorOutput "   ✅ Case-insensitive email matching" "White"
Write-ColorOutput "   ✅ Dual validation (userUsages field + orders collection)" "White"
Write-ColorOutput "   ✅ Multiple email field support" "White"
Write-ColorOutput "   ✅ Maximum safety approach (uses highest count found)" "White"
Write-ColorOutput "   ✅ Handles data synchronization issues" "White"

Write-ColorOutput ""
Write-ColorOutput "🎯 This should fix your production issue where:" "Yellow"
Write-ColorOutput "   - Localhost correctly shows: 'You have reached the usage limit for this coupon (1/1)'" "White"
Write-ColorOutput "   - Production incorrectly shows: 'discount' (allowing reuse)" "Red"

Write-ColorOutput ""
Write-ColorOutput "📞 After deployment, the production behavior should match localhost!" "Green"

Show-Header "Next Steps"

Write-ColorOutput "1. Upload the files to your Digital Ocean server" "Cyan"
Write-ColorOutput "2. Restart your backend service" "Cyan"
Write-ColorOutput "3. Test the coupon validation" "Cyan"
Write-ColorOutput "4. Run the fix script if needed: python fix_coupon_production.py" "Cyan"

Write-ColorOutput ""
Write-ColorOutput "🎉 Once deployed, your production coupon validation will work correctly!" "Green"
