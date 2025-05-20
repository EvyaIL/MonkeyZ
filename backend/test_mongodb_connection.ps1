# Test MongoDB connection for DigitalOcean
# PowerShell script for testing MongoDB connection

Set-Location $PSScriptRoot
$env:PYTHONPATH = "$PSScriptRoot;$env:PYTHONPATH"

Write-Host "Testing MongoDB connection to DigitalOcean cluster..." -ForegroundColor Cyan

$script = @"
import asyncio
import os
import logging
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

async def test_connection():
    # Load environment variables from .env file
    load_dotenv()
    
    # Get MongoDB URI from environment variable
    mongo_uri = os.getenv('MONGODB_URI')
    if not mongo_uri:
        logging.error('MONGODB_URI environment variable is not set')
        return False
    
    logging.info(f'Testing connection to: {mongo_uri[:30]}...')
    
    # For DigitalOcean managed MongoDB, we need specific connection options
    connection_options = {
        'serverSelectionTimeoutMS': 15000,
        'connectTimeoutMS': 30000,
        'socketTimeoutMS': 45000,
        'retryWrites': True,
        'retryReads': True,
        'directConnection': False
    }
      # Add replicaSet parameter if missing (needed for DigitalOcean MongoDB)
    if ('replicaSet=' not in mongo_uri) and ('mongodb+srv://' in mongo_uri):
        hostname = mongo_uri.split('@')[1].split('/')[0]
        
        # Handle public vs private DigitalOcean MongoDB URIs
        if 'private-mongodb' in hostname:
            # For private VPC URIs
            cluster_id = hostname.split('-')[2] if len(hostname.split('-')) > 2 else 'rs0'
            replica_set = f"rs-{cluster_id}"
        else:
            # For public URIs, the replica set name is usually the first part of the hostname
            cluster_id = hostname.split('-')[0] if '-' in hostname else 'mongodb'
            replica_set = cluster_id
            
        # If there's a query string, append to it
        if '?' in mongo_uri:
            mongo_uri = mongo_uri.replace('?', f'?replicaSet={replica_set}&')
        else:
            mongo_uri = f'{mongo_uri}?replicaSet={replica_set}'
        logging.info(f'Added replicaSet parameter: replicaSet={replica_set}')
    
    try:
        # Create MongoDB client
        client = AsyncIOMotorClient(mongo_uri, **connection_options)
        
        # Test connection with a ping command
        await client.admin.command('ping')
        
        # List databases as an additional test
        db_names = await client.list_database_names()
        logging.info(f'Connected successfully! Available databases: {db_names}')
        
        # Clean up
        client.close()
        return True
    
    except Exception as e:
        logging.error(f'Failed to connect to MongoDB: {str(e)}')
        return False

# Run the test
if __name__ == '__main__':
    result = asyncio.run(test_connection())
    
    if result:
        logging.info('✅ MongoDB connection test PASSED')
    else:
        logging.error('❌ MongoDB connection test FAILED')
"@

# Save the Python script temporarily
$tempScript = New-TemporaryFile
Set-Content -Path $tempScript.FullName -Value $script

# Run the Python script
try {
    python $tempScript.FullName
    if ($LASTEXITCODE -eq 0) {
        Write-Host "MongoDB connection test completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "MongoDB connection test failed with exit code $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "Error running MongoDB test: $_" -ForegroundColor Red
}

# Cleanup temporary file
Remove-Item -Path $tempScript.FullName -Force

Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
