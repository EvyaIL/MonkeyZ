# Automatic Fake Products Removal PowerShell Script
Write-Host "MonkeyZ Fake Product Auto-Removal" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

# Set path to backend scripts directory
$scriptsDir = "c:\Users\User\OneDrive\שולחן העבודה\מסמכים\GitHub\nin1\MonkeyZ\backend\scripts"

# Navigate to scripts directory
Set-Location $scriptsDir

# Run the automatic cleanup script
Write-Host "Running automatic fake product removal script..."
& python remove_fake_monkeyz_products_auto.py

Write-Host "`nCleanup process completed!" -ForegroundColor Cyan
