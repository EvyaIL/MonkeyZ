# 🚀 MonkeyZ Production Deployment Guide - Digital Ocean

## 📋 Overview
This guide covers the complete production deployment of MonkeyZ with the new **Smart Stock Fulfillment System** to Digital Ocean.

## 🆕 New Features Deployed
- **✅ Smart Stock Fulfillment**: Users always receive available items immediately
- **📧 Enhanced Email System**: Comprehensive communication for all order states
- **🔄 Auto-Retry System**: Automatic fulfillment when stock is replenished
- **📊 Partial Fulfillment Tracking**: New order status: `PARTIALLY_FULFILLED`

## 🔧 Pre-Deployment Checklist

### 1. Environment Variables
Ensure these are set in your Digital Ocean environment:

```bash
# Database
MONGODB_URI="mongodb://your-mongodb-connection-string"
MONGODB_DB_NAME="monkeyz_production"

# Email Service
MAIL_SERVER="smtp.gmail.com"
MAIL_PORT=587
MAIL_USERNAME="your-email@domain.com"
MAIL_PASSWORD="your-app-password"
MAIL_FROM="support@monkeyz.co.il"
ADMIN_EMAIL="support@monkeyz.co.il"

# Security
JWT_SECRET="your-super-secure-jwt-secret"
PAYPAL_CLIENT_ID="your-paypal-live-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-live-secret"
PAYPAL_MODE="live"  # Set to "live" for production

# CORS
FRONTEND_URL="https://your-domain.com"
```

### 2. Database Migration Notes
- New order status: `PARTIALLY_FULFILLED` added to StatusEnum
- New field: `fulfillment_status` added to OrderItem model
- Existing orders will work seamlessly with backward compatibility

## 🐳 Docker Production Setup

### Backend Dockerfile Optimizations
The backend is ready with production optimizations:
- Multi-stage build for smaller image size
- Non-root user for security
- Health checks included
- Proper logging configuration

### Docker Compose Production
Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - MONGODB_DB_NAME=${MONGODB_DB_NAME}
      - MAIL_SERVER=${MAIL_SERVER}
      - MAIL_PORT=${MAIL_PORT}
      - MAIL_USERNAME=${MAIL_USERNAME}
      - MAIL_PASSWORD=${MAIL_PASSWORD}
      - MAIL_FROM=${MAIL_FROM}
      - ADMIN_EMAIL=${ADMIN_EMAIL}
      - JWT_SECRET=${JWT_SECRET}
      - PAYPAL_CLIENT_ID=${PAYPAL_CLIENT_ID}
      - PAYPAL_CLIENT_SECRET=${PAYPAL_CLIENT_SECRET}
      - PAYPAL_MODE=live
      - FRONTEND_URL=${FRONTEND_URL}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REACT_APP_API_URL=https://your-api-domain.com
      - REACT_APP_PAYPAL_CLIENT_ID=${PAYPAL_CLIENT_ID}
    restart: unless-stopped
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
```

## 🌐 Digital Ocean Deployment Steps

### 1. Server Setup
```bash
# Update server
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Application Deployment
```bash
# Clone repository
git clone https://github.com/EvyaIL/MonkeyZ.git
cd MonkeyZ

# Set up environment variables
cp .env.example .env
# Edit .env with your production values

# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. SSL/HTTPS Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📧 Email Configuration for Production

### Gmail Setup (Recommended)
1. Enable 2FA on your Gmail account
2. Generate an App Password:
   - Google Account → Security → App passwords
   - Select "Mail" and generate password
3. Use the generated password as `MAIL_PASSWORD`

### Email Templates Included
- ✅ **Complete Order**: Full fulfillment with all keys
- 📧 **Partial Delivery**: Immediate keys + pending notification
- ⏳ **Awaiting Stock**: Professional pending notification
- 🔄 **Additional Keys**: Automatic fulfillment updates

## 🔄 Auto-Retry System

The system automatically retries failed orders when:
- New stock is added via admin panel
- Manual retry endpoint is triggered
- Scheduled background job runs (optional)

### Manual Retry Endpoint
```bash
POST /admin/orders/retry-failed
Authorization: Bearer <admin-token>
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints
- `GET /health` - Basic health check
- `GET /api/health` - API health with database connectivity
- `GET /admin/metrics` - Admin metrics dashboard

### Log Monitoring
```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Monitor order processing
docker-compose -f docker-compose.prod.yml logs -f backend | grep "Order\|Stock\|Email"
```

## 🔐 Security Considerations

### Production Security Checklist
- ✅ All environment variables properly set
- ✅ JWT secret is cryptographically secure
- ✅ PayPal configured for live mode
- ✅ CORS restricted to your domain
- ✅ HTTPS enabled with valid SSL certificate
- ✅ Database connections encrypted
- ✅ Email passwords using app-specific passwords

### Firewall Setup
```bash
# Configure UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 🧪 Production Testing

### 1. Order Flow Testing
- Test complete fulfillment (sufficient stock)
- Test partial fulfillment (limited stock)
- Test stock shortage (no stock)
- Test auto-retry after stock addition

### 2. Email Testing
- Verify all email templates render correctly
- Test email delivery for all scenarios
- Confirm admin notifications work

### 3. Admin Panel Testing
- Test stock management features
- Verify retry functionality
- Check analytics and reporting

## 🚨 Troubleshooting

### Common Issues
1. **Email not sending**: Check MAIL_PASSWORD and firewall settings
2. **Orders stuck in PENDING**: Verify auto-retry system is working
3. **Database connection**: Check MONGODB_URI format
4. **PayPal integration**: Ensure live credentials are correct

### Emergency Commands
```bash
# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Force recreate containers
docker-compose -f docker-compose.prod.yml up -d --force-recreate

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

## 📈 Performance Optimization

### Database Indexing
Ensure these indexes exist in MongoDB:
```javascript
// Orders collection
db.orders.createIndex({ "status": 1 })
db.orders.createIndex({ "email": 1 })
db.orders.createIndex({ "coupon_code": 1 })
db.orders.createIndex({ "createdAt": -1 })

// Products collection
db.products.createIndex({ "cdKeys.isUsed": 1 })
```

### Nginx Optimization
The included nginx.conf includes:
- Gzip compression
- Static file caching
- Load balancing
- Rate limiting

## 🎯 Deployment Validation

After deployment, verify:
1. ✅ Frontend loads correctly
2. ✅ API endpoints respond
3. ✅ Order placement works
4. ✅ Email notifications send
5. ✅ Admin panel accessible
6. ✅ Stock management functional
7. ✅ Auto-retry system operational

## 📞 Support

For deployment issues:
- Check logs: `docker-compose -f docker-compose.prod.yml logs`
- Verify environment variables
- Test email configuration
- Confirm database connectivity

---

**🚀 Your MonkeyZ platform is now production-ready with enhanced stock fulfillment!**

Users will now:
- Always receive immediate communication about their orders
- Get available items right away (partial fulfillment)
- Receive clear timelines for pending items
- Automatically get additional items when restocked

**No more silent failures or incomplete orders!** 🎉
