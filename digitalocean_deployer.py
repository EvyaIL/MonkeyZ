#!/usr/bin/env python3
"""
DigitalOcean Coupon Fix Deployment Script

This script will help you deploy the enhanced coupon validation to your DigitalOcean server.
It handles both SSH deployment and provides manual upload instructions.
"""

import subprocess
import sys
import os
import json
from pathlib import Path

class DigitalOceanDeployer:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.backend_path = self.project_root / "backend"
        
    def check_ssh_config(self):
        """Check if SSH is configured for DigitalOcean."""
        print("🔍 Checking SSH configuration...")
        
        # Check if we have any SSH configs
        ssh_config = Path.home() / ".ssh" / "config"
        if ssh_config.exists():
            print(f"   ✅ SSH config file exists: {ssh_config}")
            return True
        else:
            print(f"   ⚠️  No SSH config found")
            return False
    
    def show_manual_deployment_steps(self):
        """Show manual deployment steps for DigitalOcean."""
        print("\n🚀 Manual Deployment Steps for DigitalOcean")
        print("=" * 50)
        
        print("\n1️⃣ Upload the Fixed File")
        print("Upload this file to your DigitalOcean server:")
        print(f"   📁 Local: {self.backend_path}/src/services/coupon_service.py")
        print("   📁 Remote: /path/to/your/app/backend/src/services/coupon_service.py")
        
        print("\nUsing SCP (if you have SSH access):")
        print("   scp backend/src/services/coupon_service.py user@your-server-ip:/path/to/app/backend/src/services/")
        
        print("\nUsing DigitalOcean Console/File Manager:")
        print("   1. Open DigitalOcean Console or file manager")
        print("   2. Navigate to your app directory")
        print("   3. Replace the coupon_service.py file")
        
        print("\n2️⃣ Restart Your Application")
        print("Choose the method that matches your deployment:")
        
        print("\nOption A: Docker Deployment")
        print("   cd /path/to/your/app")
        print("   docker-compose -f docker-compose.prod.yml down")
        print("   docker-compose -f docker-compose.prod.yml build backend") 
        print("   docker-compose -f docker-compose.prod.yml up -d")
        
        print("\nOption B: Direct Python/Uvicorn")
        print("   pkill -f uvicorn  # Stop current backend")
        print("   cd /path/to/your/app/backend")
        print("   uvicorn main:app --host 0.0.0.0 --port 8000 &")
        
        print("\nOption C: PM2 (if using PM2)")
        print("   pm2 restart backend")
        
        print("\nOption D: Systemd Service (if configured)")
        print("   sudo systemctl restart monkeyz-backend")
        
    def create_ssh_deployment_script(self):
        """Create a script for SSH-based deployment."""
        script_content = '''#!/bin/bash
# DigitalOcean SSH Deployment Script
# Usage: ./deploy_to_digitalocean.sh user@your-server-ip

if [ -z "$1" ]; then
    echo "Usage: $0 user@server-ip"
    echo "Example: $0 root@123.456.789.123"
    exit 1
fi

SERVER="$1"
REMOTE_PATH="/root/MonkeyZ"  # Adjust this to your app path

echo "🚀 Deploying coupon fix to DigitalOcean..."
echo "Target: $SERVER"
echo "Remote path: $REMOTE_PATH"

# Upload the fixed coupon service
echo "📤 Uploading enhanced coupon_service.py..."
scp backend/src/services/coupon_service.py "$SERVER:$REMOTE_PATH/backend/src/services/"

if [ $? -eq 0 ]; then
    echo "✅ File uploaded successfully"
else
    echo "❌ Upload failed"
    exit 1
fi

# Upload the fix script
echo "📤 Uploading database fix script..."
scp fix_coupon_production.py "$SERVER:$REMOTE_PATH/"

# Restart the application via SSH
echo "🔄 Restarting application..."
ssh "$SERVER" << 'EOF'
cd /root/MonkeyZ
echo "Stopping containers..."
docker-compose -f docker-compose.prod.yml down
echo "Rebuilding backend..."
docker-compose -f docker-compose.prod.yml build backend
echo "Starting containers..."
docker-compose -f docker-compose.prod.yml up -d
echo "✅ Deployment complete!"
EOF

echo "🎉 Deployment finished!"
echo "🧪 Test your production site now:"
echo "   1. Try using the same coupon twice"
echo "   2. Should show: 'You have reached the usage limit for this coupon (1/1)'"
'''
        
        script_path = self.project_root / "deploy_to_digitalocean.sh"
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        # Make it executable on Unix-like systems
        if os.name != 'nt':
            os.chmod(script_path, 0o755)
        
        print(f"📝 Created SSH deployment script: {script_path}")
        return script_path
    
    def test_production_after_deployment(self, production_url):
        """Test production after deployment."""
        print(f"\n🧪 Testing Production After Deployment")
        print("=" * 40)
        
        if not production_url:
            production_url = input("Enter your production URL (e.g., https://yoursite.com): ").strip()
        
        if production_url:
            print(f"🌐 Production URL: {production_url}")
            print("\n🔍 Manual Test Steps:")
            print("1. Go to your production website")
            print("2. Add items to cart")
            print("3. Try to apply a coupon you've used before")
            print("4. Expected result: 'You have reached the usage limit for this coupon (1/1)'")
            print("5. If it shows 'discount' instead, the fix didn't deploy correctly")
            
            # Try to run the automated test
            try:
                print(f"\n🤖 Running automated test...")
                subprocess.run([sys.executable, "deploy_production_coupon_fix.py"], 
                             input=production_url, text=True, timeout=30)
            except Exception as e:
                print(f"❌ Automated test failed: {e}")
                print("Use manual testing instead")
        
    def run_deployment_wizard(self):
        """Run the complete deployment wizard."""
        print("🧙‍♂️ DigitalOcean Coupon Fix Deployment Wizard")
        print("=" * 50)
        
        print("\n🎯 Issue: Coupon validation works on localhost but fails on DigitalOcean")
        print("🔧 Solution: Deploy enhanced coupon validation logic")
        
        # Check current files
        coupon_service_file = self.backend_path / "src/services/coupon_service.py"
        if coupon_service_file.exists():
            print(f"✅ Enhanced coupon_service.py is ready")
        else:
            print(f"❌ coupon_service.py not found at {coupon_service_file}")
            return
        
        # Check SSH
        has_ssh = self.check_ssh_config()
        
        print(f"\n📋 Deployment Options:")
        print("1. Automatic SSH deployment (if you have SSH access)")
        print("2. Manual file upload instructions") 
        print("3. Show both options")
        
        choice = input("\nSelect option (1/2/3): ").strip()
        
        if choice == "1" and has_ssh:
            # SSH deployment
            server = input("Enter your server (user@ip, e.g., root@123.456.789.123): ").strip()
            if server:
                script_path = self.create_ssh_deployment_script()
                print(f"\n🚀 Run this command to deploy:")
                print(f"   bash {script_path} {server}")
        
        elif choice == "2" or choice == "3":
            # Manual deployment
            self.show_manual_deployment_steps()
        
        if choice == "1" or choice == "3":
            if has_ssh:
                script_path = self.create_ssh_deployment_script()
                print(f"\n🤖 Automatic SSH deployment script created: {script_path}")
        
        # Testing
        print(f"\n🧪 After deployment, test your production site:")
        production_url = input("Enter production URL for testing (optional): ").strip()
        if production_url:
            self.test_production_after_deployment(production_url)

def main():
    deployer = DigitalOceanDeployer()
    deployer.run_deployment_wizard()

if __name__ == "__main__":
    main()
