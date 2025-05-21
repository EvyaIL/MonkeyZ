# Pre-Deployment Test Script
# This script validates that your application is ready for deployment to DigitalOcean

# Check for .env files
function Test-EnvFiles {
    Write-Host "🔍 Checking environment files..." -ForegroundColor Cyan
    
    $backendEnv = Test-Path "backend\.env"
    $frontendEnv = Test-Path "frontend\.env"
    
    if ($backendEnv) { 
        Write-Host "✅ Backend .env file exists" -ForegroundColor Green 
    } else { 
        Write-Host "❌ Backend .env file missing" -ForegroundColor Red
    }
    
    if ($frontendEnv) {
        Write-Host "✅ Frontend .env file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend .env file missing" -ForegroundColor Red
    }
}

# Check for DigitalOcean config files
function Test-DOConfig {
    Write-Host "🔍 Checking DigitalOcean configuration files..." -ForegroundColor Cyan
    
    $backendConfig = Test-Path "backend\.do\app.yaml"
    $frontendConfig = Test-Path "frontend\.do\app.yaml"
    
    if ($backendConfig) {
        Write-Host "✅ Backend DigitalOcean config exists" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend DigitalOcean config missing" -ForegroundColor Red
    }
    
    if ($frontendConfig) {
        Write-Host "✅ Frontend DigitalOcean config exists" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend DigitalOcean config missing" -ForegroundColor Red
    }
}

# Check for health endpoint
function Test-HealthEndpoint {
    Write-Host "🔍 Checking backend health endpoint..." -ForegroundColor Cyan
    
    $healthEndpointExists = Select-String -Path "backend\main.py" -Pattern "@app.get\([""]*/health[""]"
    
    if ($healthEndpointExists) {
        Write-Host "✅ Health endpoint exists in main.py" -ForegroundColor Green
    } else {
        Write-Host "❌ Health endpoint missing in main.py" -ForegroundColor Red
    }
}

# Check MongoDB test script
function Test-MongoDBScript {
    Write-Host "🔍 Checking MongoDB test script..." -ForegroundColor Cyan
    
    $mongoTestExists = Test-Path "backend\test_mongodb_connection.py"
    
    if ($mongoTestExists) {
        Write-Host "✅ MongoDB test script exists" -ForegroundColor Green
    } else {
        Write-Host "❌ MongoDB test script missing" -ForegroundColor Red
    }
}

# Check requirements.txt
function Test-Requirements {
    Write-Host "🔍 Checking backend requirements.txt..." -ForegroundColor Cyan
    
    $requirementsContent = Get-Content "backend\requirements.txt" -ErrorAction SilentlyContinue
    
    if ($requirementsContent) {
        Write-Host "✅ requirements.txt has content" -ForegroundColor Green
        
        # Check for critical packages
        $criticalPackages = @("fastapi", "uvicorn", "motor", "python-jose", "bcrypt", "python-multipart")
        foreach ($package in $criticalPackages) {
            if ($requirementsContent -match $package) {
                Write-Host "  ✅ $package found" -ForegroundColor Green
            } else {
                Write-Host "  ❌ $package not found" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "❌ requirements.txt missing or empty" -ForegroundColor Red
    }
}

# Check for empty files
function Test-EmptyFiles {
    Write-Host "🔍 Checking for empty files..." -ForegroundColor Cyan
    
    $emptyFiles = Get-ChildItem -Path . -Recurse -File | Where-Object { $_.Length -eq 0 } | Select-Object -ExpandProperty FullName
    
    if ($emptyFiles.Count -gt 0) {
        Write-Host "❌ Found empty files:" -ForegroundColor Red
        foreach ($file in $emptyFiles) {
            Write-Host "  - $file" -ForegroundColor Red
        }
    } else {
        Write-Host "✅ No empty files found" -ForegroundColor Green
    }
}

# Run all tests
Write-Host "🚀 Running pre-deployment tests for DigitalOcean..." -ForegroundColor Cyan
Write-Host "--------------------------------------------------" -ForegroundColor Cyan

Test-EnvFiles
Write-Host ""
Test-DOConfig
Write-Host ""
Test-HealthEndpoint
Write-Host ""
Test-MongoDBScript
Write-Host ""
Test-Requirements
Write-Host ""
Test-EmptyFiles

Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host "🎯 Pre-deployment tests completed!" -ForegroundColor Cyan
Write-Host "Review any issues marked with ❌ before deploying to DigitalOcean."
