# List Products Categorized Script
Write-Host "MonkeyZ Product Listing (Categorized)" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Set path to the scripts directory
$scriptsDir = "c:\Users\User\OneDrive\שולחן העבודה\מסמכים\GitHub\nin1\MonkeyZ\backend\scripts"
Set-Location $scriptsDir

Write-Host "Running product listing script..."
try {
    # Run with python command
    python list_products_categorized.py
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nListing completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "`nListing script exited with code: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "Error running script: $_" -ForegroundColor Red
}
