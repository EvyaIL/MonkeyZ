# MonkeyZ Admin Account Creation Helper
Write-Host "MonkeyZ Admin Account Creator" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
Set-Location -Path ".\backend"

# Check if Python is available
try {
    python --version
} catch {
    Write-Host "Python is not found in your system PATH. Please install Python first." -ForegroundColor Red
    exit
}

# Check if the create_admin.py script exists
if (-not (Test-Path -Path ".\create_admin.py")) {
    Write-Host "Error: create_admin.py script not found." -ForegroundColor Red
    exit
}

# Make sure MongoDB is running
Write-Host "Before proceeding, make sure your MongoDB server is running." -ForegroundColor Yellow
Write-Host "Hit Enter to continue or Ctrl+C to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Run the create_admin.py script
Write-Host "`nStarting admin account creation process...`n" -ForegroundColor Green

# Run the Python script for admin creation
python create_admin.py

Write-Host "`nProcess completed. You can now sign in to the MonkeyZ website using your admin credentials." -ForegroundColor Green
Write-Host "Visit http://localhost:3000/admin to access the admin panel after starting your application." -ForegroundColor Green

# Return to original directory
Set-Location -Path ".."
