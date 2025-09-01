#!/bin/bash
# Quick Email Fix Deployment Script for DigitalOcean
# Usage: ./deploy_email_fix.sh user@your-server-ip

if [ -z "$1" ]; then
    echo "Usage: $0 user@server-ip"
    echo "Example: $0 root@123.456.789.123"
    exit 1
fi

SERVER="$1"
REMOTE_PATH="/root/MonkeyZ"  # Adjust this to your app path

echo "📧 Deploying email fix to DigitalOcean..."
echo "Target: $SERVER"
echo "Remote path: $REMOTE_PATH"

# Upload the fixed email service
echo "📤 Uploading fixed email_service.py..."
scp backend/src/services/email_service.py "$SERVER:$REMOTE_PATH/backend/src/services/"

if [ $? -eq 0 ]; then
    echo "✅ Email service uploaded successfully"
else
    echo "❌ Upload failed"
    exit 1
fi

# Upload the environment template
echo "📤 Uploading environment template..."
scp .env.production.template "$SERVER:$REMOTE_PATH/.env.template"

# Restart the application via SSH
echo "🔄 Restarting application..."
ssh "$SERVER" << 'EOF'
cd /root/MonkeyZ
echo "📋 Current environment check..."
if [ -f .env ]; then
    echo "✅ .env file exists"
    if grep -q "MAIL_USERNAME" .env; then
        echo "✅ MAIL_USERNAME found in .env"
    else
        echo "⚠️  MAIL_USERNAME not found in .env - you need to add email credentials"
    fi
else
    echo "⚠️  No .env file found - copy .env.template to .env and fill in your credentials"
fi

echo "🔄 Restarting containers..."
docker-compose -f docker-compose.prod.yml down
echo "🔨 Rebuilding backend..."
docker-compose -f docker-compose.prod.yml build backend
echo "🚀 Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

echo "📋 Checking container status..."
docker-compose -f docker-compose.prod.yml ps

echo "✅ Deployment complete!"
EOF

echo ""
echo "🎉 Email fix deployment finished!"
echo ""
echo "📋 Next steps:"
echo "1. SSH to your server: ssh $SERVER"
echo "2. Edit .env file with your actual email credentials"
echo "3. Restart containers: docker-compose -f docker-compose.prod.yml restart backend"
echo "4. Test by placing an order on your production site"
echo ""
echo "🔍 To check if emails are working:"
echo "   Look for this in logs: 'Email service enabled - SMTP: smtp.gmail.com:587'"
echo "   If you see 'Email service disabled', check your .env file"
