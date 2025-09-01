#!/bin/bash

# 🚀 MonkeyZ Production Deployment Script for Digital Ocean
# This script handles the complete deployment process

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print with colors
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
PROJECT_NAME="monkeyz"
DOMAIN=${DOMAIN:-"your-domain.com"}
API_DOMAIN=${API_DOMAIN:-"api.your-domain.com"}
ENVIRONMENT=${ENVIRONMENT:-"production"}

print_status "🚀 Starting MonkeyZ deployment to Digital Ocean"
print_status "Domain: $DOMAIN"
print_status "Environment: $ENVIRONMENT"

# Check prerequisites
check_prerequisites() {
    print_status "🔍 Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    if [ ! -f ".env" ]; then
        print_warning ".env file not found, copying from .env.production"
        cp .env.production .env
        print_warning "Please edit .env file with your production values"
        read -p "Press enter to continue after editing .env file..."
    fi
    
    print_success "Prerequisites check completed"
}

# Build and deploy
deploy() {
    print_status "🏗️ Building and deploying containers..."
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down --remove-orphans || true
    
    # Remove old images (optional, saves space)
    if [ "$1" = "--clean" ]; then
        print_status "Cleaning old images..."
        docker system prune -af
    fi
    
    # Build and start services
    print_status "Building new images..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    print_status "Starting services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Deployment completed"
}

# Setup SSL certificates
setup_ssl() {
    print_status "🔒 Setting up SSL certificates..."
    
    if [ ! -f "nginx/ssl/fullchain.pem" ]; then
        print_status "Installing Certbot..."
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
        
        print_status "Obtaining SSL certificate for $DOMAIN..."
        sudo certbot certonly --standalone --preferred-challenges http -d $DOMAIN -d www.$DOMAIN -d $API_DOMAIN
        
        # Copy certificates to nginx directory
        sudo mkdir -p nginx/ssl
        sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/
        sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/
        sudo chown -R $USER:$USER nginx/ssl
        
        # Setup auto-renewal
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        
        print_success "SSL certificates configured"
    else
        print_success "SSL certificates already exist"
    fi
}

# Update nginx configuration with actual domain
update_nginx_config() {
    print_status "📝 Updating nginx configuration..."
    
    # Replace placeholder domain in nginx config
    sed -i "s/your-domain.com/$DOMAIN/g" nginx/nginx.prod.conf
    
    print_success "Nginx configuration updated"
}

# Health check
health_check() {
    print_status "🏥 Performing health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check backend
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_success "Backend is healthy"
    else
        print_error "Backend health check failed"
        docker-compose -f docker-compose.prod.yml logs backend
        exit 1
    fi
    
    # Check frontend
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        print_success "Frontend is healthy"
    else
        print_error "Frontend health check failed"
        docker-compose -f docker-compose.prod.yml logs frontend
        exit 1
    fi
    
    print_success "All health checks passed"
}

# Setup firewall
setup_firewall() {
    print_status "🔥 Configuring firewall..."
    
    sudo ufw allow ssh
    sudo ufw allow 80
    sudo ufw allow 443
    sudo ufw --force enable
    
    print_success "Firewall configured"
}

# Setup monitoring
setup_monitoring() {
    print_status "📊 Setting up basic monitoring..."
    
    # Create monitoring script
    cat > monitor.sh << 'EOF'
#!/bin/bash
# Basic monitoring script

echo "=== MonkeyZ System Status ==="
echo "Date: $(date)"
echo "Uptime: $(uptime)"
echo ""

echo "=== Docker Services ==="
docker-compose -f docker-compose.prod.yml ps
echo ""

echo "=== System Resources ==="
echo "Memory Usage:"
free -h
echo ""
echo "Disk Usage:"
df -h
echo ""

echo "=== Recent Logs ==="
echo "Backend Logs (last 10 lines):"
docker-compose -f docker-compose.prod.yml logs --tail=10 backend
echo ""
echo "Frontend Logs (last 10 lines):"
docker-compose -f docker-compose.prod.yml logs --tail=10 frontend
EOF

    chmod +x monitor.sh
    
    # Setup log rotation
    cat > /etc/logrotate.d/monkeyz << 'EOF'
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 nginx nginx
    postrotate
        docker-compose -f docker-compose.prod.yml restart nginx
    endscript
}
EOF
    
    print_success "Monitoring setup completed"
}

# Main deployment function
main() {
    print_status "🎯 MonkeyZ Production Deployment Starting..."
    
    check_prerequisites
    update_nginx_config
    
    if [ "$1" = "--setup" ]; then
        setup_firewall
        setup_ssl
        setup_monitoring
    fi
    
    deploy "$2"
    health_check
    
    print_success "🎉 Deployment completed successfully!"
    print_status "🌐 Your MonkeyZ platform is now running at:"
    print_status "   Frontend: https://$DOMAIN"
    print_status "   API: https://$API_DOMAIN"
    print_status ""
    print_status "📊 Monitor your deployment:"
    print_status "   ./monitor.sh"
    print_status "   docker-compose -f docker-compose.prod.yml logs -f"
    print_status ""
    print_status "🔧 Useful commands:"
    print_status "   Restart services: docker-compose -f docker-compose.prod.yml restart"
    print_status "   View logs: docker-compose -f docker-compose.prod.yml logs -f [service]"
    print_status "   Update deployment: ./deploy.sh --clean"
}

# Help function
show_help() {
    echo "MonkeyZ Production Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --setup          First-time setup (SSL, firewall, monitoring)"
    echo "  --clean          Clean old Docker images before deployment"
    echo "  --help           Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  DOMAIN          Your domain name (default: your-domain.com)"
    echo "  API_DOMAIN      Your API domain (default: api.your-domain.com)"
    echo "  ENVIRONMENT     Deployment environment (default: production)"
    echo ""
    echo "Examples:"
    echo "  $0 --setup --clean    # First-time setup with clean build"
    echo "  $0 --clean            # Regular deployment with clean build"
    echo "  $0                    # Quick deployment without cleaning"
}

# Parse command line arguments
case "$1" in
    --help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
