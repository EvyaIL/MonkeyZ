# Fix product tags and restart server
# This script will:
# 1. Fix product tags in the database
# 2. Restart the backend server
# 3. Test the frontend

# Function to handle errors
function Handle-Error {
    param (
        [string]$ErrorMessage
    )
    Write-Host "ERROR: $ErrorMessage" -ForegroundColor Red
    exit 1
}

# Change to backend directory
try {
    $backendPath = "C:\Users\User\OneDrive\שולחן העבודה\מסמכים\GitHub\nin1\MonkeyZ\backend"
    Set-Location $backendPath
    Write-Host "Changed directory to backend folder" -ForegroundColor Green
} catch {
    Handle-Error "Failed to change directory: $_"
}

# Run the fix_product_tags script
try {
    Write-Host "Running product tags fix script..." -ForegroundColor Cyan
    python fix_product_tags.py
    Write-Host "Product tags fixed successfully" -ForegroundColor Green
} catch {
    Handle-Error "Failed to run fix_product_tags.py: $_"
}

# Stop any running backend processes
try {
    Write-Host "Stopping any running backend processes..." -ForegroundColor Cyan
    Get-Process -Name python -ErrorAction SilentlyContinue | 
        Where-Object { $_.CommandLine -like "*main.py*" } | 
        Stop-Process -Force
    Write-Host "Stopped running backend processes" -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not stop backend processes: $_" -ForegroundColor Yellow
}

# Start the backend server
try {
    Write-Host "Starting the backend server..." -ForegroundColor Cyan
    Start-Process -FilePath "python" -ArgumentList "main.py" -NoNewWindow
    Write-Host "Backend server started" -ForegroundColor Green
    
    # Give the server time to start
    Write-Host "Waiting for server to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
} catch {
    Handle-Error "Failed to start backend server: $_"
}

# Return to main directory
Set-Location "C:\Users\User\OneDrive\שולחן העבודה\מסמכים\GitHub\nin1\MonkeyZ"

# Run the frontend tests
try {
    Write-Host "Opening test product tags page in browser..." -ForegroundColor Cyan
    Start-Process "http://localhost:3000/test-product-tags"
    Write-Host "Browser opened with test page" -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not open browser automatically: $_" -ForegroundColor Yellow
    Write-Host "Please open http://localhost:3000/test-product-tags manually to verify fix" -ForegroundColor Yellow
}

Write-Host "`nProduct tags fix completed!" -ForegroundColor Green
Write-Host "Please check the following in your browser:" -ForegroundColor Cyan
Write-Host "1. Homepage products should be displaying correctly" -ForegroundColor White
Write-Host "2. Best seller tags should be visible on products marked as best sellers" -ForegroundColor White
Write-Host "3. New tags should be visible on products marked as new" -ForegroundColor White
Write-Host "4. Discount percentages should be visible on products with discounts" -ForegroundColor White
