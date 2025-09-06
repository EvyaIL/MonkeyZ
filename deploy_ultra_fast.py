#!/usr/bin/env python3
"""
Ultra-Fast Deployment Script for MonkeyZ
Comprehensive deployment with all performance optimizations
"""

import os
import sys
import subprocess
import shutil
import json
import time
from pathlib import Path
from typing import Dict, List, Optional

class MonkeyZUltraFastDeployment:
    def __init__(self, environment: str = "production"):
        self.environment = environment
        self.root_path = Path.cwd()
        self.backend_path = self.root_path / "backend"
        self.frontend_path = self.root_path / "frontend"
        self.build_path = self.frontend_path / "build"
        
        self.deployment_config = {
            "production": {
                "backend_port": 8000,
                "frontend_build": True,
                "optimizations": True,
                "compression": True,
                "caching": True,
                "monitoring": True
            },
            "staging": {
                "backend_port": 8001,
                "frontend_build": True,
                "optimizations": True,
                "compression": False,
                "caching": True,
                "monitoring": False
            },
            "development": {
                "backend_port": 8002,
                "frontend_build": False,
                "optimizations": False,
                "compression": False,
                "caching": False,
                "monitoring": True
            }
        }
        
        self.config = self.deployment_config.get(environment, self.deployment_config["production"])
    
    def log(self, message: str, level: str = "INFO"):
        """Enhanced logging with timestamps"""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
    
    def run_command(self, command: str, cwd: Optional[Path] = None) -> bool:
        """Run shell command with error handling"""
        self.log(f"Running: {command}")
        
        try:
            result = subprocess.run(
                command,
                shell=True,
                cwd=cwd or self.root_path,
                check=True,
                capture_output=True,
                text=True
            )
            
            if result.stdout:
                self.log(f"Output: {result.stdout}")
            
            return True
            
        except subprocess.CalledProcessError as e:
            self.log(f"Command failed: {e}", "ERROR")
            if e.stderr:
                self.log(f"Error output: {e.stderr}", "ERROR")
            return False
    
    def check_prerequisites(self) -> bool:
        """Check if all required tools are installed"""
        self.log("🔍 Checking prerequisites...")
        
        required_tools = {
            "node": "node --version",
            "npm": "npm --version",
            "python": "python --version",
            "docker": "docker --version"
        }
        
        missing_tools = []
        
        for tool, command in required_tools.items():
            try:
                subprocess.run(command, shell=True, check=True, capture_output=True)
                self.log(f"✅ {tool} is available")
            except subprocess.CalledProcessError:
                self.log(f"❌ {tool} is not available", "ERROR")
                missing_tools.append(tool)
        
        if missing_tools:
            self.log(f"Missing required tools: {', '.join(missing_tools)}", "ERROR")
            return False
        
        return True
    
    def setup_backend(self) -> bool:
        """Setup backend with performance optimizations"""
        self.log("🚀 Setting up ultra-fast backend...")
        
        if not self.backend_path.exists():
            self.log("Backend directory not found", "ERROR")
            return False
        
        # Install Python dependencies with performance packages
        requirements = """
fastapi[all]==0.104.1
uvicorn[standard]==0.24.0
uvloop==0.19.0
httptools==0.6.1
orjson==3.9.10
asyncpg==0.29.0
aiomysql==0.2.0
sqlalchemy[asyncio]==2.0.23
redis[hiredis]==5.0.1
psutil==5.9.6
aioredis==2.0.1
        """.strip()
        
        # Write optimized requirements
        requirements_file = self.backend_path / "requirements.txt"
        with open(requirements_file, "w") as f:
            f.write(requirements)
        
        # Install dependencies
        if not self.run_command("pip install -r requirements.txt", self.backend_path):
            self.log("Failed to install backend dependencies", "ERROR")
            return False
        
        # Copy optimized main file
        if (self.backend_path / "main_optimized.py").exists():
            shutil.copy2(
                self.backend_path / "main_optimized.py",
                self.backend_path / "main.py"
            )
            self.log("✅ Optimized main.py deployed")
        
        self.log("✅ Backend setup completed")
        return True
    
    def setup_frontend(self) -> bool:
        """Setup frontend with performance optimizations"""
        self.log("🎨 Setting up ultra-fast frontend...")
        
        if not self.frontend_path.exists():
            self.log("Frontend directory not found", "ERROR")
            return False
        
        # Install Node dependencies
        if not self.run_command("npm install", self.frontend_path):
            self.log("Failed to install frontend dependencies", "ERROR")
            return False
        
        # Update package.json with performance optimizations
        package_json_path = self.frontend_path / "package.json"
        
        if package_json_path.exists():
            with open(package_json_path, 'r') as f:
                package_data = json.load(f)
            
            # Add performance dependencies
            performance_deps = {
                "react-virtualized": "^9.22.3",
                "react-intersection-observer": "^9.5.3",
                "react-lazy-load-image-component": "^1.6.0",
                "workbox-webpack-plugin": "^7.0.0"
            }
            
            if "dependencies" not in package_data:
                package_data["dependencies"] = {}
            
            package_data["dependencies"].update(performance_deps)
            
            # Add performance build scripts
            if "scripts" not in package_data:
                package_data["scripts"] = {}
            
            package_data["scripts"]["build:optimized"] = "GENERATE_SOURCEMAP=false npm run build"
            package_data["scripts"]["analyze"] = "npx webpack-bundle-analyzer build/static/js/*.js"
            
            # Write updated package.json
            with open(package_json_path, 'w') as f:
                json.dump(package_data, f, indent=2)
            
            # Install new dependencies
            if not self.run_command("npm install", self.frontend_path):
                self.log("Failed to install performance dependencies", "ERROR")
                return False
        
        # Copy optimized service worker
        sw_source = self.frontend_path / "public" / "sw-optimized.js"
        sw_dest = self.frontend_path / "public" / "sw.js"
        
        if sw_source.exists():
            shutil.copy2(sw_source, sw_dest)
            self.log("✅ Optimized service worker deployed")
        
        # Copy optimized App component
        app_source = self.frontend_path / "src" / "AppOptimized.js"
        app_dest = self.frontend_path / "src" / "App.js"
        
        if app_source.exists():
            shutil.copy2(app_source, app_dest)
            self.log("✅ Optimized App component deployed")
        
        # Build frontend for production
        if self.config["frontend_build"]:
            self.log("🏗️  Building optimized frontend...")
            
            # Set environment variables for optimization
            env_vars = {
                "GENERATE_SOURCEMAP": "false",
                "INLINE_RUNTIME_CHUNK": "false",
                "IMAGE_INLINE_SIZE_LIMIT": "0"
            }
            
            # Build with optimizations
            build_command = "npm run build:optimized" if "build:optimized" in package_data.get("scripts", {}) else "npm run build"
            
            # Set environment variables and build
            env_command = " ".join([f"{k}={v}" for k, v in env_vars.items()])
            full_command = f"{env_command} {build_command}"
            
            if not self.run_command(full_command, self.frontend_path):
                self.log("Frontend build failed", "ERROR")
                return False
            
            self.log("✅ Frontend build completed")
        
        self.log("✅ Frontend setup completed")
        return True
    
    def setup_nginx_config(self) -> bool:
        """Setup optimized Nginx configuration"""
        self.log("⚙️ Setting up optimized Nginx configuration...")
        
        nginx_config = f"""
server {{
    listen 80;
    server_name _;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Brotli compression (if available)
    brotli on;
    brotli_comp_level 6;
    brotli_types
        text/plain
        text/css
        application/json
        application/javascript
        text/xml
        application/xml
        application/xml+rss
        text/javascript;
    
    # Static file caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|pdf|txt|webp|avif)$ {{
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }}
    
    # Frontend static files
    location /static/ {{
        alias /app/frontend/build/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }}
    
    # API proxy with caching
    location /api/ {{
        proxy_pass http://backend:{self.config['backend_port']};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # API response caching
        proxy_cache_valid 200 302 5m;
        proxy_cache_valid 404 1m;
        add_header X-Cache-Status $upstream_cache_status;
    }}
    
    # Frontend SPA routes
    location / {{
        root /app/frontend/build;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }}
    
    # Health check endpoint
    location /health {{
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }}
}}
"""
        
        # Write Nginx config
        nginx_dir = self.root_path / "nginx"
        nginx_dir.mkdir(exist_ok=True)
        
        with open(nginx_dir / "nginx.conf", "w") as f:
            f.write(nginx_config.strip())
        
        self.log("✅ Nginx configuration created")
        return True
    
    def create_docker_compose(self) -> bool:
        """Create optimized Docker Compose configuration"""
        self.log("🐳 Creating optimized Docker Compose configuration...")
        
        docker_compose = f"""
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "{self.config['backend_port']}:{self.config['backend_port']}"
    environment:
      - ENVIRONMENT={self.environment}
      - DATABASE_URL=${{DATABASE_URL}}
      - REDIS_URL=${{REDIS_URL}}
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:{self.config['backend_port']}/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf
      - ./frontend/build:/app/frontend/build
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - backend
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 128M

volumes:
  redis_data:
"""
        
        with open(self.root_path / "docker-compose.optimized.yml", "w") as f:
            f.write(docker_compose.strip())
        
        self.log("✅ Docker Compose configuration created")
        return True
    
    def create_backend_dockerfile(self) -> bool:
        """Create optimized backend Dockerfile"""
        self.log("🐳 Creating optimized backend Dockerfile...")
        
        dockerfile = """
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    g++ \\
    libpq-dev \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \\
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app && \\
    chown -R app:app /app
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:8000/health || exit 1

# Run application with optimizations
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--loop", "uvloop", "--http", "httptools"]
"""
        
        with open(self.backend_path / "Dockerfile", "w") as f:
            f.write(dockerfile.strip())
        
        self.log("✅ Backend Dockerfile created")
        return True
    
    def optimize_build_output(self) -> bool:
        """Optimize build output for performance"""
        self.log("⚡ Optimizing build output...")
        
        if not self.build_path.exists():
            self.log("Build directory not found, skipping optimization", "WARNING")
            return True
        
        # Compress static assets
        try:
            import gzip
            import brotli
            
            for file_path in self.build_path.rglob("*"):
                if file_path.is_file() and file_path.suffix in [".js", ".css", ".html", ".json"]:
                    # Create gzipped version
                    with open(file_path, "rb") as f_in:
                        with gzip.open(f"{file_path}.gz", "wb") as f_out:
                            f_out.write(f_in.read())
                    
                    # Create brotli version
                    with open(file_path, "rb") as f_in:
                        with open(f"{file_path}.br", "wb") as f_out:
                            f_out.write(brotli.compress(f_in.read()))
            
            self.log("✅ Static assets compressed")
            
        except ImportError:
            self.log("Compression libraries not available, skipping", "WARNING")
        
        return True
    
    def deploy(self) -> bool:
        """Execute complete ultra-fast deployment"""
        self.log(f"🚀 Starting ultra-fast deployment for {self.environment} environment")
        
        steps = [
            ("Prerequisites", self.check_prerequisites),
            ("Backend Setup", self.setup_backend),
            ("Frontend Setup", self.setup_frontend),
            ("Nginx Configuration", self.setup_nginx_config),
            ("Docker Configuration", self.create_docker_compose),
            ("Backend Dockerfile", self.create_backend_dockerfile),
            ("Build Optimization", self.optimize_build_output)
        ]
        
        success_count = 0
        total_steps = len(steps)
        
        for step_name, step_function in steps:
            self.log(f"📋 Executing: {step_name}")
            
            if step_function():
                success_count += 1
                self.log(f"✅ {step_name} completed successfully")
            else:
                self.log(f"❌ {step_name} failed", "ERROR")
                return False
        
        self.log(f"🎉 Ultra-fast deployment completed successfully!")
        self.log(f"📊 {success_count}/{total_steps} steps completed")
        
        # Display next steps
        self.log("📝 Next Steps:")
        self.log("1. Set environment variables (DATABASE_URL, REDIS_URL)")
        self.log("2. Run: docker-compose -f docker-compose.optimized.yml up -d")
        self.log("3. Monitor performance at: http://localhost/api/performance/metrics")
        
        return True


def main():
    """Main deployment function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="MonkeyZ Ultra-Fast Deployment")
    parser.add_argument(
        "--environment",
        choices=["development", "staging", "production"],
        default="production",
        help="Deployment environment"
    )
    
    args = parser.parse_args()
    
    deployment = MonkeyZUltraFastDeployment(args.environment)
    
    try:
        success = deployment.deploy()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        deployment.log("Deployment cancelled by user", "WARNING")
        sys.exit(1)
    except Exception as e:
        deployment.log(f"Unexpected error: {e}", "ERROR")
        sys.exit(1)


if __name__ == "__main__":
    main()
