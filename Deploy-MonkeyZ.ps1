# Deploy-MonkeyZ.ps1
# This script helps deploy both backend and frontend to DigitalOcean

# Set color scheme for better readability
$infoColor = "Cyan"
$successColor = "Green"
$errorColor = "Red"
$warningColor = "Yellow"
$highlightColor = "Magenta"

function Show-Header {
    param (
        [string]$title
    )
    
    Write-Host "`n===== $title =====" -ForegroundColor $highlightColor
}

function Test-Prerequisites {
    Show-Header "Checking Prerequisites"
    
    # Check for doctl
    $hasDoctl = $null -ne (Get-Command "doctl" -ErrorAction SilentlyContinue)
    if ($hasDoctl) {
        Write-Host "✓ DigitalOcean CLI (doctl) is installed" -ForegroundColor $successColor
    } else {
        Write-Host "✗ DigitalOcean CLI (doctl) is not installed" -ForegroundColor $errorColor
        Write-Host "  Please install from: https://docs.digitalocean.com/reference/doctl/how-to/install/" -ForegroundColor $infoColor
        return $false
    }
    
    # Check doctl auth
    try {
        $doctlAuth = doctl account get
        if ($doctlAuth) {
            Write-Host "✓ DigitalOcean CLI is authenticated" -ForegroundColor $successColor
        }
    } catch {
        Write-Host "✗ DigitalOcean CLI is not authenticated" -ForegroundColor $errorColor
        Write-Host "  Run: doctl auth init" -ForegroundColor $infoColor
        return $false
    }
    
    # Check app.yaml files
    if (Test-Path "frontend\.do\app.yaml") {
        Write-Host "✓ Frontend app.yaml exists" -ForegroundColor $successColor
    } else {
        Write-Host "✗ Frontend app.yaml is missing" -ForegroundColor $errorColor
        return $false
    }
    
    if (Test-Path "backend\.do\app.yaml") {
        Write-Host "✓ Backend app.yaml exists" -ForegroundColor $successColor
    } else {
        Write-Host "✗ Backend app.yaml is missing" -ForegroundColor $errorColor
        return $false
    }
    
    return $true
}

function Verify-HealthChecks {
    Show-Header "Verifying Health Check Configuration"
    
    # Check backend health endpoint
    if (Select-String -Path "backend\main.py" -Pattern "@app.get\(['""]\/health['""]") {
        Write-Host "✓ Backend health endpoint exists" -ForegroundColor $successColor
    } else {
        Write-Host "✗ Backend health endpoint is missing" -ForegroundColor $errorColor
        Write-Host "  Please add: @app.get('/health') def health_check(): return {'status': 'healthy'}" -ForegroundColor $infoColor
        return $false
    }
    
    # Check frontend health files
    if (Test-Path "frontend\public\health.json") {
        Write-Host "✓ Frontend health.json exists" -ForegroundColor $successColor
    } else {
        Write-Host "✗ Frontend health.json is missing" -ForegroundColor $errorColor
        return $false
    }
    
    # Check app.yaml health check configuration
    $backendYaml = Get-Content "backend\.do\app.yaml" -Raw
    if ($backendYaml -match "health_check:") {
        Write-Host "✓ Backend health check is configured" -ForegroundColor $successColor
    } else {
        Write-Host "✗ Backend health check is not configured" -ForegroundColor $errorColor
        return $false
    }
    
    $frontendYaml = Get-Content "frontend\.do\app.yaml" -Raw
    if ($frontendYaml -match "health_check:") {
        Write-Host "✓ Frontend health check is configured" -ForegroundColor $successColor
    } else {
        Write-Host "✗ Frontend health check is not configured" -ForegroundColor $errorColor
        return $false
    }
    
    return $true
}

function Deploy-Backend {
    Show-Header "Deploying Backend"
    
    try {
        Set-Location backend
        Write-Host "Creating DigitalOcean App from backend/.do/app.yaml..." -ForegroundColor $infoColor
        doctl apps create --spec .do/app.yaml
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Backend deployed successfully!" -ForegroundColor $successColor
            $success = $true
        } else {
            Write-Host "✗ Backend deployment failed" -ForegroundColor $errorColor
            $success = $false
        }
        Set-Location ..
        return $success
    } catch {
        Write-Host "✗ Backend deployment error: $_" -ForegroundColor $errorColor
        Set-Location ..
        return $false
    }
}

function Deploy-Frontend {
    Show-Header "Deploying Frontend"
    
    try {
        Set-Location frontend
        Write-Host "Creating DigitalOcean App from frontend/.do/app.yaml..." -ForegroundColor $infoColor
        doctl apps create --spec .do/app.yaml
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Frontend deployed successfully!" -ForegroundColor $successColor
            $success = $true
        } else {
            Write-Host "✗ Frontend deployment failed" -ForegroundColor $errorColor
            $success = $false
        }
        Set-Location ..
        return $success
    } catch {
        Write-Host "✗ Frontend deployment error: $_" -ForegroundColor $errorColor
        Set-Location ..
        return $false
    }
}

function Get-AppURLs {
    Show-Header "Getting Application URLs"
    
    try {
        $apps = doctl apps list --format ID,Spec.Name,DefaultIngress --no-header
        
        foreach ($line in $apps) {
            $parts = $line -split '\s+'
            if ($parts.Count -ge 3) {
                $id = $parts[0]
                $name = $parts[1]
                $url = $parts[2]
                
                if ($name -match "backend") {
                    Write-Host "Backend URL: $url" -ForegroundColor $highlightColor
                    $backendUrl = $url
                } elseif ($name -match "frontend") {
                    Write-Host "Frontend URL: $url" -ForegroundColor $highlightColor
                    $frontendUrl = $url
                }
            }
        }
        
        if ($backendUrl) {
            Write-Host "  Backend Health: $backendUrl/health" -ForegroundColor $infoColor
        }
        
        if ($frontendUrl) {
            Write-Host "  Frontend Health: $frontendUrl/health.json" -ForegroundColor $infoColor
        }
    } catch {
        Write-Host "✗ Error getting app URLs: $_" -ForegroundColor $errorColor
    }
}

# Main deployment process
Write-Host "MonkeyZ DigitalOcean Deployment" -ForegroundColor $highlightColor
Write-Host "=============================" -ForegroundColor $highlightColor

if (-not (Test-Prerequisites)) {
    Write-Host "Prerequisites check failed. Please fix the issues and try again." -ForegroundColor $errorColor
    exit 1
}

if (-not (Verify-HealthChecks)) {
    Write-Host "Health check verification failed. Please fix the issues and try again." -ForegroundColor $errorColor
    exit 1
}

$deployBackend = Read-Host "Deploy backend to DigitalOcean? (y/n)"
if ($deployBackend -eq "y") {
    if (-not (Deploy-Backend)) {
        Write-Host "Backend deployment failed. Please check the errors above." -ForegroundColor $errorColor
    }
}

$deployFrontend = Read-Host "Deploy frontend to DigitalOcean? (y/n)"
if ($deployFrontend -eq "y") {
    if (-not (Deploy-Frontend)) {
        Write-Host "Frontend deployment failed. Please check the errors above." -ForegroundColor $errorColor
    }
}

Get-AppURLs

Write-Host "`nDeployment process completed!" -ForegroundColor $highlightColor
Write-Host "Remember to check the DigitalOcean dashboard for deployment status and logs." -ForegroundColor $infoColor
