# MonkeyZ Cleanup Fake Products PowerShell Script
# This script removes fake MonkeyZ products while keeping legitimate ones with gibberish names
# Legitimate products: NNNa, UTa, knkkmk, TestNUmb4, tadddd1, Homtest
# Fake products: Anything starting with "MonkeyZ"

Write-Host "MonkeyZ Fake Product Cleanup" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan

# Set paths
$rootDir = "c:\Users\User\OneDrive\שולחן העבודה\מסמכים\GitHub\nin1\MonkeyZ"
$backendDir = Join-Path $rootDir "backend"
$scriptsDir = Join-Path $backendDir "scripts"

# Navigate to the scripts directory
Set-Location $scriptsDir

Write-Host "`nStep 1: Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version
    Write-Host "✓ $pythonVersion detected" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 2: Installing required Python packages..." -ForegroundColor Yellow
try {
    pip install motor pymongo
    Write-Host "✓ Required packages installed/verified" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install Python packages: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 3: Listing current products before cleanup..." -ForegroundColor Yellow
try {
    Write-Host "Current products in database:`n" -ForegroundColor Magenta
    python list_products.py
    Write-Host "`n✓ Product listing complete" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to list products: $_" -ForegroundColor Red
    # Continue anyway
}

# Create our improved MongoDB script that targets all MonkeyZ products
$scriptPath = Join-Path $scriptsDir "remove_fake_monkeyz_products.py"
$scriptContent = @'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import re

MONGODB_URI = "mongodb+srv://doadmin:MOpg1x782Wj94t56@mongodb1-92cc6b02.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=mongodb1"
DB_NAME = "shop"

# List of legitimate product names with gibberish names to keep
LEGITIMATE_PRODUCTS = [
    "NNNa", "UTa", "knkkmk", "TestNUmb4", "tadddd1", "Homtest"
]

async def remove_fake_monkeyz_products():
    """Remove fake MonkeyZ products from the database while keeping legitimate ones"""
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    
    print("Searching for fake MonkeyZ products...")
    
    # Find and list all products first
    all_products = await db["products"].find({}).to_list(length=1000)
    
    print(f"Found {len(all_products)} total products in database.")
    
    # Identify fake products (those starting with "MonkeyZ" and not in the legitimate list)
    fake_products = []
    legitimate_products = []
    
    for product in all_products:
        product_name = product.get("name")
        
        # Handle different name formats (string or object)
        if isinstance(product_name, dict):
            # Try to get English name first, then Hebrew, then stringify the object
            display_name = product_name.get("en") or product_name.get("he") or str(product_name)
        else:
            display_name = product_name
            
        # Check if this is a fake product (starts with MonkeyZ and not in legitimate list)
        is_fake = False
        
        if isinstance(display_name, str):
            if display_name.startswith("MonkeyZ") and display_name not in LEGITIMATE_PRODUCTS:
                is_fake = True
                fake_products.append(product)
            else:
                legitimate_products.append(product)
        else:
            # If name isn't a string, consider it legitimate
            legitimate_products.append(product)
    
    print(f"\nFound {len(fake_products)} fake MonkeyZ products to remove:")
    for product in fake_products:
        name = product.get("name")
        if isinstance(name, dict):
            name = name.get("en") or name.get("he") or str(name)
        print(f"- {name} (ID: {product.get('_id')})")
    
    # Remove the fake products
    removed_count = 0
    if fake_products:
        confirm = input("\nDo you want to proceed with removal? (yes/no): ").strip().lower()
        if confirm == "yes" or confirm == "y":
            for product in fake_products:
                result = await db["products"].delete_one({"_id": product["_id"]})
                name = product.get("name")
                if isinstance(name, dict):
                    name = name.get("en") or name.get("he") or str(name)
                
                if result.deleted_count > 0:
                    print(f"✓ Removed: {name}")
                    removed_count += 1
                else:
                    print(f"✗ Failed to remove: {name}")
            
            print(f"\nRemoval complete! Removed {removed_count} fake products.")
        else:
            print("Removal cancelled.")
    else:
        print("No fake products found to remove.")
    
    # Show remaining products
    print("\nRemaining products:")
    remaining_products = await db["products"].find({}).to_list(length=1000)
    for p in remaining_products:
        name = p.get("name")
        if isinstance(name, dict):
            name = name.get("en") or name.get("he") or str(name)
        print(f"- {name}")
    
    client.close()

if __name__ == "__main__":
    try:
        asyncio.run(remove_fake_monkeyz_products())
    except Exception as e:
        print(f"Error running script: {e}")
        import traceback
        traceback.print_exc()
'@

Write-Host "`nStep 4: Setting up the improved fake product removal script..." -ForegroundColor Yellow
try {
    Set-Content -Path $scriptPath -Value $scriptContent
    Write-Host "✓ Cleanup script created/updated" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create cleanup script: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 5: Running the MonkeyZ fake product cleanup script..." -ForegroundColor Yellow
Write-Host "This will identify all products starting with 'MonkeyZ' and remove them" -ForegroundColor Magenta
Write-Host "While keeping legitimate products with gibberish names: NNNa, UTa, knkkmk, TestNUmb4, tadddd1, Homtest" -ForegroundColor Magenta

$response = Read-Host "`nDo you want to continue? (yes/no)"
if ($response.ToLower() -eq "yes" -or $response.ToLower() -eq "y") {
    try {
        Write-Host "`nRunning cleanup script - you will be prompted to confirm deletions..." -ForegroundColor Yellow
        python $scriptPath
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✓ Fake product cleanup completed successfully!" -ForegroundColor Green
        } else {
            Write-Host "`n✗ Cleanup script exited with code: $LASTEXITCODE" -ForegroundColor Red
        }
    } catch {
        Write-Host "`n✗ Error running cleanup script: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Cleanup cancelled by user" -ForegroundColor Yellow
    exit 0
}

Write-Host "`nStep 6: Verifying results..." -ForegroundColor Yellow
try {
    Write-Host "Remaining products in database after cleanup:`n" -ForegroundColor Magenta
    python list_products.py
    Write-Host "`n✓ Verification complete" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to verify results: $_" -ForegroundColor Red
}

Write-Host "`nMonkeyZ Fake Product Cleanup Completed!" -ForegroundColor Cyan