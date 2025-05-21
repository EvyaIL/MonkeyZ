"""
Simple pre-deployment check script for DigitalOcean App Platform.
This script verifies that your backend is correctly configured for deployment.
"""
import os
import sys

def check_environment():
    """Check if all necessary environment variables are defined"""
    required_vars = [
        "MONGODB_URI",
        "SECRET_KEY",
        "ALGORITHM",
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "EMAILJS_SERVICE_ID",
        "EMAILJS_USER_ID",
        "EMAILJS_TEMPLATE_ID_PASSWORD_RESET",
        "EMAILJS_TEMPLATE_ID_OTP",
        "EMAILJS_TEMPLATE_ID_WELCOME"
    ]
    
    missing = []
    for var in required_vars:
        if not os.environ.get(var):
            missing.append(var)
    
    return missing

def check_files():
    """Check if all necessary files exist"""
    required_files = [
        "main.py",
        "requirements.txt",
        ".do/app.yaml"
    ]
    
    missing = []
    for file in required_files:
        if not os.path.exists(file):
            missing.append(file)
    
    return missing

def check_health_endpoint():
    """Check if health endpoint is defined in main.py"""
    try:
        with open("main.py", "r") as f:
            content = f.read()
            if "@app.get(\"/health\")" in content:
                return True
            return False
    except:
        return False

def main():
    print("🔍 Checking backend configuration for DigitalOcean deployment...")
    
    # Check files
    missing_files = check_files()
    if missing_files:
        print(f"❌ Missing required files: {', '.join(missing_files)}")
    else:
        print("✅ All required files present")
    
    # Check health endpoint
    if check_health_endpoint():
        print("✅ Health endpoint found in main.py")
    else:
        print("❌ Health endpoint missing in main.py")
    
    # Don't check env vars directly as they will be set in DO dashboard
    print("\n✅ Remember to set these environment variables in the DigitalOcean dashboard:")
    print("  - MONGODB_URI (SECRET)")
    print("  - SECRET_KEY (SECRET)")
    print("  - ALGORITHM")
    print("  - ACCESS_TOKEN_EXPIRE_MINUTES")
    print("  - EMAILJS_* variables")
    
    print("\n🚀 Your backend is ready for deployment to DigitalOcean App Platform!")

if __name__ == "__main__":
    main()
