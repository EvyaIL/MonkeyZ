# Run MongoDB connection test
Write-Host "Running MongoDB connection test..." -ForegroundColor Cyan

# Activate Python virtual environment if it exists
if (Test-Path ".\venv\Scripts\Activate.ps1") {
    & .\venv\Scripts\Activate.ps1
    Write-Host "Virtual environment activated" -ForegroundColor Green
}

# Run the test script
try {
    python ./backend/test_mongodb_connection.py
    if ($LASTEXITCODE -eq 0) {
        Write-Host "MongoDB connection test completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "MongoDB connection test failed with exit code $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "Error running MongoDB test: $_" -ForegroundColor Red
}

# Run EmailJS config test
Write-Host "`nRunning EmailJS configuration test..." -ForegroundColor Cyan
try {
    python ./backend/test_emailjs_config.py
    if ($LASTEXITCODE -eq 0) {
        Write-Host "EmailJS configuration test completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "EmailJS configuration test failed with exit code $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "Error running EmailJS test: $_" -ForegroundColor Red
}

# Keep window open
Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
