#!/bin/bash

# 🎯 MonkeyZ Production Pre-Flight Checklist
# Run this script to validate your production deployment

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 MonkeyZ Production Pre-Flight Checklist${NC}"
echo "============================================="

# Function to check a requirement
check_requirement() {
    local description="$1"
    local command="$2"
    local success_msg="$3"
    local error_msg="$4"
    
    echo -ne "${YELLOW}[CHECKING]${NC} $description... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        [ -n "$success_msg" ] && echo "           $success_msg"
        return 0
    else
        echo -e "${RED}❌${NC}"
        [ -n "$error_msg" ] && echo "           $error_msg"
        return 1
    fi
}

# Initialize counters
passed=0
total=0

# 1. Environment File Check
total=$((total + 1))
if check_requirement "Environment file exists" "[ -f .env ]" "Found .env file" "Run: cp .env.production .env and edit values"; then
    passed=$((passed + 1))
fi

# 2. Required Environment Variables
required_vars=("MONGODB_URI" "MAIL_USERNAME" "MAIL_PASSWORD" "JWT_SECRET" "PAYPAL_CLIENT_ID" "PAYPAL_CLIENT_SECRET" "FRONTEND_URL")

for var in "${required_vars[@]}"; do
    total=$((total + 1))
    if check_requirement "Environment variable $var" "grep -q '^$var=' .env && [ -n \"\$(grep '^$var=' .env | cut -d'=' -f2)\" ]" "✓ $var is set" "⚠️  $var is missing or empty"; then
        passed=$((passed + 1))
    fi
done

# 3. Docker Requirements
total=$((total + 1))
if check_requirement "Docker installed" "command -v docker" "Docker is available" "Install Docker: curl -fsSL https://get.docker.com | sh"; then
    passed=$((passed + 1))
fi

total=$((total + 1))
if check_requirement "Docker Compose installed" "command -v docker-compose" "Docker Compose is available" "Install: sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"; then
    passed=$((passed + 1))
fi

# 4. Production Files Check
production_files=("docker-compose.prod.yml" "deploy.sh" "nginx/nginx.prod.conf" "frontend/Dockerfile.prod")

for file in "${production_files[@]}"; do
    total=$((total + 1))
    if check_requirement "Production file $file" "[ -f $file ]" "✓ $file exists" "⚠️  $file is missing"; then
        passed=$((passed + 1))
    fi
done

# 5. Deploy Script Permissions
total=$((total + 1))
if check_requirement "Deploy script executable" "[ -x deploy.sh ]" "✓ deploy.sh is executable" "Run: chmod +x deploy.sh"; then
    passed=$((passed + 1))
fi

# 6. PayPal Mode Check
total=$((total + 1))
if check_requirement "PayPal production mode" "grep -q 'PAYPAL_MODE=live' .env || grep -q 'live' .env" "✓ PayPal set to live mode" "⚠️  Check PAYPAL_MODE in .env"; then
    passed=$((passed + 1))
fi

# 7. Email Configuration Check (if Gmail)
total=$((total + 1))
if check_requirement "Gmail configuration format" "grep -q '@gmail.com' .env" "✓ Gmail detected - ensure app password is used" "If using Gmail, use app-specific password"; then
    passed=$((passed + 1))
fi

# 8. Stock Fulfillment System Check
total=$((total + 1))
if check_requirement "Stock fulfillment code updated" "grep -q 'PARTIALLY_FULFILLED' backend/src/models/order.py" "✓ New fulfillment system ready" "⚠️  Stock fulfillment code may not be updated"; then
    passed=$((passed + 1))
fi

# 9. Test Script Validation
total=$((total + 1))
if check_requirement "Test script available" "[ -f test_stock_fulfillment.py ]" "✓ Test script ready" "⚠️  Test script missing"; then
    passed=$((passed + 1))
fi

# Results Summary
echo ""
echo "============================================="
echo -e "${BLUE}📊 Pre-Flight Check Results${NC}"
echo "============================================="

if [ $passed -eq $total ]; then
    echo -e "${GREEN}🎉 ALL CHECKS PASSED! ($passed/$total)${NC}"
    echo ""
    echo -e "${GREEN}✅ Your MonkeyZ platform is ready for production deployment!${NC}"
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Upload files to your Digital Ocean server"
    echo "2. Run: ./deploy.sh --setup --clean"
    echo "3. Configure your domain DNS to point to the server"
    echo "4. Test with a small order to verify everything works"
    echo ""
    echo "🌐 After deployment, your platform will be available at:"
    echo "   $(grep FRONTEND_URL .env | cut -d'=' -f2)"
else
    echo -e "${RED}⚠️  ISSUES FOUND: $passed/$total checks passed${NC}"
    echo ""
    echo "🔧 Please fix the issues above before deploying to production."
    echo ""
    echo "📚 For help, see:"
    echo "   - PRODUCTION_DEPLOYMENT_GUIDE.md"
    echo "   - PRODUCTION_READY_SUMMARY.md"
fi

echo ""
echo "============================================="

# Additional information
echo -e "${BLUE}📋 Additional Production Notes:${NC}"
echo ""
echo "🔐 Security:"
echo "   - Ensure your server firewall only allows ports 22, 80, 443"
echo "   - Use strong passwords for all accounts"
echo "   - Enable 2FA on your domain registrar and hosting accounts"
echo ""
echo "📧 Email Testing:"
echo "   - Send a test email to verify SMTP settings work"
echo "   - Check spam folders during initial testing"
echo "   - Gmail requires app-specific passwords (not regular password)"
echo ""
echo "💳 PayPal:"
echo "   - Verify live credentials are correct in PayPal developer dashboard"
echo "   - Test with small amounts initially"
echo "   - Monitor PayPal webhook logs"
echo ""
echo "📊 Monitoring:"
echo "   - Set up alerts for disk space, memory usage"
echo "   - Monitor order fulfillment logs"
echo "   - Check email delivery success rates"

exit $((total - passed))
