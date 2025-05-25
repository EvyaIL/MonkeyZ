# Restart script for the MonkeyZ frontend with clean environment
$env:NODE_ENV = "development"
$env:REACT_APP_PATH_BACKEND = ""

Write-Host "Stopping any running npm processes..."
Stop-Process -Name "node" -ErrorAction SilentlyContinue

Write-Host "Clearing build cache..."
Remove-Item -Path "./node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Starting the React development server..."
cd frontend
npm start
