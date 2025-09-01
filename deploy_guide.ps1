# Production Coupon Fix - Deployment Guide

Write-Host "===== MonkeyZ Production Coupon Fix Deployment =====" -ForegroundColor Magenta
Write-Host ""
Write-Host "🚀 This will help you deploy the coupon validation fix" -ForegroundColor Cyan

Write-Host ""
Write-Host "===== 1. Files That Need To Be Uploaded =====" -ForegroundColor Magenta

$filesToUpload = @(
    "backend/src/services/coupon_service.py",
    "backend/admin_coupon_fix_endpoint.py", 
    "debug_coupon_production.py",
    "fix_coupon_production.py"
)

foreach ($file in $filesToUpload) {
    $fullPath = Join-Path $PWD $file
    if (Test-Path $fullPath) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file (NOT FOUND)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📋 CRITICAL FILE: backend/src/services/coupon_service.py" -ForegroundColor Yellow
Write-Host "   This contains the enhanced validation logic that fixes the production bug." -ForegroundColor Yellow

Write-Host ""
Write-Host "===== 2. How to Deploy to Digital Ocean =====" -ForegroundColor Magenta

Write-Host "Option A: Using Docker (Recommended)" -ForegroundColor Cyan
Write-Host "   1. Upload all files to your server" -ForegroundColor White
Write-Host "   2. Run on your Digital Ocean server:" -ForegroundColor White
Write-Host "      cd /path/to/your/app" -ForegroundColor Gray
Write-Host "      docker-compose -f docker-compose.prod.yml down" -ForegroundColor Gray
Write-Host "      docker-compose -f docker-compose.prod.yml build backend" -ForegroundColor Gray
Write-Host "      docker-compose -f docker-compose.prod.yml up -d" -ForegroundColor Gray

Write-Host ""
Write-Host "Option B: Direct File Upload" -ForegroundColor Cyan
Write-Host "   1. SCP/SFTP the coupon_service.py to your server:" -ForegroundColor White
Write-Host "      scp backend/src/services/coupon_service.py user@yourserver:/path/to/backend/src/services/" -ForegroundColor Gray
Write-Host "   2. Restart your FastAPI backend" -ForegroundColor White

Write-Host ""
Write-Host "===== 3. Testing the Fix =====" -ForegroundColor Magenta

Write-Host "📝 To test the fix, run:" -ForegroundColor Cyan
Write-Host "   python deploy_production_coupon_fix.py" -ForegroundColor Gray
Write-Host ""
Write-Host "   Or manually test your production site:" -ForegroundColor White
Write-Host "   1. Try to use the same coupon twice with the same email" -ForegroundColor White  
Write-Host "   2. First time should work" -ForegroundColor White
Write-Host "   3. Second time should show: 'You have reached the usage limit for this coupon (1/1)'" -ForegroundColor White

Write-Host ""
Write-Host "===== 4. What This Fix Does =====" -ForegroundColor Magenta

Write-Host "🔧 Enhanced Coupon Validation Features:" -ForegroundColor Green
Write-Host "   ✅ Case-insensitive email matching" -ForegroundColor White
Write-Host "   ✅ Dual validation (userUsages field + orders collection)" -ForegroundColor White
Write-Host "   ✅ Multiple email field support" -ForegroundColor White
Write-Host "   ✅ Maximum safety approach (uses highest count found)" -ForegroundColor White
Write-Host "   ✅ Handles data synchronization issues" -ForegroundColor White

Write-Host ""
Write-Host "🎯 This should fix your production issue where:" -ForegroundColor Yellow
Write-Host "   - Localhost correctly shows: 'You have reached the usage limit for this coupon (1/1)'" -ForegroundColor White
Write-Host "   - Production incorrectly shows: 'discount' (allowing reuse)" -ForegroundColor Red

Write-Host ""
Write-Host "📞 After deployment, the production behavior should match localhost!" -ForegroundColor Green

Write-Host ""
Write-Host "===== Next Steps =====" -ForegroundColor Magenta

Write-Host "1. Upload the files to your Digital Ocean server" -ForegroundColor Cyan
Write-Host "2. Restart your backend service" -ForegroundColor Cyan
Write-Host "3. Test the coupon validation" -ForegroundColor Cyan
Write-Host "4. Run the fix script if needed: python fix_coupon_production.py" -ForegroundColor Cyan

Write-Host ""
Write-Host "🎉 Once deployed, your production coupon validation will work correctly!" -ForegroundColor Green
