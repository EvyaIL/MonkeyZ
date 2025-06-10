# Remove Fake MonkeyZ Products PowerShell Script
Write-Host "MonkeyZ Fake Product Removal Script" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

# Navigate to backend directory
$backendPath = "c:\Users\User\OneDrive\שולחן העבודה\מסמכים\GitHub\nin1\MonkeyZ\backend"
Set-Location $backendPath

Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
try {
    pip install motor pymongo --quiet
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install dependencies: $_" -ForegroundColor Red
}

Write-Host "Running fake product removal script..." -ForegroundColor Yellow
try {
    $output = python scripts\remove_fake_monkeyz_products.py 2>&1
    if ($output) {
        Write-Host $output
    }
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Script executed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Script failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error running script: $_" -ForegroundColor Red
}

Write-Host "`nFake product removal process completed!" -ForegroundColor Cyan
