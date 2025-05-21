# This PowerShell script tests the health endpoint locally

Write-Host "Testing server health endpoint..." -ForegroundColor Cyan

# Check if the server is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health.json" -Method GET -ErrorAction Stop
    $statusCode = $response.StatusCode
    
    if ($statusCode -eq 200) {
        Write-Host "Health check successful! Status code: $statusCode" -ForegroundColor Green
        $content = $response.Content | ConvertFrom-Json
        Write-Host "Response: $($content | ConvertTo-Json)" -ForegroundColor Green
    } else {
        Write-Host "Health check failed! Status code: $statusCode" -ForegroundColor Red
    }
} catch {
    Write-Host "Error connecting to health endpoint: $_" -ForegroundColor Red
    
    # Check if server is running on a different port
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health.json" -Method GET -ErrorAction Stop
        Write-Host "Server is running on port 3000 instead of 8080!" -ForegroundColor Yellow
    } catch {
        Write-Host "Server does not appear to be running on port 3000 either." -ForegroundColor Red
    }
    
    # Check if build directory exists
    if (Test-Path -Path "build") {
        Write-Host "Build directory exists." -ForegroundColor Green
    } else {
        Write-Host "Build directory is missing!" -ForegroundColor Red
    }
    
    # Check if health files exist
    if (Test-Path -Path "public/health.json") {
        Write-Host "health.json exists in public directory." -ForegroundColor Green
    } else {
        Write-Host "health.json is missing from public directory!" -ForegroundColor Red
    }
    
    if (Test-Path -Path "build/health.json") {
        Write-Host "health.json exists in build directory." -ForegroundColor Green
    } else {
        Write-Host "health.json is missing from build directory!" -ForegroundColor Red
    }
    
    # Help user resolve the issue
    Write-Host "`nTo fix health check issues:" -ForegroundColor Cyan
    Write-Host "1. Make sure the server is running on port 8080" -ForegroundColor White
    Write-Host "2. Ensure health.json exists in both public/ and build/" -ForegroundColor White
    Write-Host "3. If using DigitalOcean, verify app.yaml has correct health_check settings" -ForegroundColor White
}
