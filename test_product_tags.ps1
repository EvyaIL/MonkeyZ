Write-Host "Testing product tag display fixes..." -ForegroundColor Cyan

# Step 1: Navigate to the frontend directory
cd frontend
Write-Host "Starting frontend development server..." -ForegroundColor Yellow
Start-Process -NoNewWindow npm -ArgumentList "start" -PassThru

# Step 2: Wait for frontend to start
Write-Host "Waiting for 10 seconds for frontend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 3: Check if backend is running, if not start it
cd ..\backend
$backendProcess = Get-Process -Name python -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -like "*main.py*"}
if (!$backendProcess) {
    Write-Host "Starting backend server..." -ForegroundColor Yellow
    Start-Process -NoNewWindow python -ArgumentList "main.py" -PassThru
    Start-Sleep -Seconds 5
}

# Step 4: Open browser to test
Write-Host "Opening browser to test product tags..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host "Test completed. Please verify the following:" -ForegroundColor Magenta
Write-Host "1. Product tags (NEW, BEST SELLER, % OFF) should appear on product images" -ForegroundColor White
Write-Host "2. Homepage should only show products marked for homepage display" -ForegroundColor White
Write-Host "3. Best seller section should only show products marked as best sellers" -ForegroundColor White

Write-Host "Press any key to stop the servers when done testing..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Step 5: Stop the servers
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -like "*react-scripts start*"} | Stop-Process
Get-Process -Name python -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -like "*main.py*"} | Stop-Process

Write-Host "Testing complete." -ForegroundColor Cyan
