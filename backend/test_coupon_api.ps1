# Test Coupon API with PowerShell
# Replace these variables with your actual admin credentials
$username = "admin"
$password = "admin"
$baseUrl = "http://localhost:8000"

Write-Host "Testing Coupon API..."
Write-Host "1. Logging in to get token..."

# Login to get token
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/user/login" -Method Post -ContentType "application/x-www-form-urlencoded" -Body "username=$username&password=$password"
$token = $loginResponse.access_token

Write-Host "Login successful, received token"

# Get all coupons
Write-Host "2. Getting all coupons..."
try {
    $coupons = Invoke-RestMethod -Uri "$baseUrl/admin/coupons" -Method Get -Headers @{
        "Authorization" = "Bearer $token"
    }
    Write-Host "Successfully retrieved $($coupons.Count) coupons"
} catch {
    Write-Host "Failed to get coupons: $_"
}

# Create a new coupon
Write-Host "3. Creating a new coupon..."
$uniqueCode = "TEST" + (Get-Date).ToString("yyyyMMddHHmmss")
$expiresAt = (Get-Date).AddDays(30).ToString("o") # ISO 8601 format

$couponData = @{
    "code" = $uniqueCode
    "discountPercent" = 20.0
    "active" = $true
    "expiresAt" = $expiresAt
    "maxUses" = 100
} | ConvertTo-Json

try {
    $newCoupon = Invoke-RestMethod -Uri "$baseUrl/admin/coupons" -Method Post -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } -Body $couponData
    
    Write-Host "Successfully created coupon with code: $($newCoupon.code) and id: $($newCoupon.id)"
    
    # Update the coupon we just created
    Write-Host "4. Updating the coupon..."
    $updateData = @{
        "discountPercent" = 25.0
    } | ConvertTo-Json
    
    $updatedCoupon = Invoke-RestMethod -Uri "$baseUrl/admin/coupons/$($newCoupon.id)" -Method Patch -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } -Body $updateData
    
    Write-Host "Successfully updated coupon with discountPercent: $($updatedCoupon.discountPercent)"
    
    # Uncomment to delete the test coupon
    # Write-Host "5. Deleting the coupon..."
    # $deleteResponse = Invoke-RestMethod -Uri "$baseUrl/admin/coupons/$($newCoupon.id)" -Method Delete -Headers @{
    #     "Authorization" = "Bearer $token"
    # }
    # Write-Host "Successfully deleted coupon"
    
} catch {
    Write-Host "API error: $_"
}

Write-Host "Test completed!"
