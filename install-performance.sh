#!/bin/bash

# MonkeyZ Performance Optimization Installation Script
echo "🚀 Starting MonkeyZ Performance Optimization..."

# Navigate to frontend directory
cd frontend

# Install React Query for data fetching optimization
echo "📦 Installing React Query..."
npm install @tanstack/react-query @tanstack/react-query-devtools

# Install React Window for virtualization
echo "📦 Installing React Window for list virtualization..."
npm install react-window react-window-infinite-loader

# Install Web Vitals for performance monitoring
echo "📦 Installing Web Vitals for performance monitoring..."
npm install web-vitals

# Install additional optimization packages
echo "📦 Installing additional performance packages..."
npm install @loadable/component react-intersection-observer

# Development dependencies for bundle analysis
echo "📦 Installing development optimization tools..."
npm install --save-dev webpack-bundle-analyzer

# Navigate to backend directory
cd ../backend

# Install backend performance packages
echo "📦 Installing backend performance optimizations..."
pip install redis fastapi-cache2[redis] uvloop

echo "✅ All performance packages installed successfully!"

# Print next steps
echo ""
echo "🎯 NEXT STEPS:"
echo "=============="
echo "1. Wrap your App with QueryClientProvider (see /src/lib/queryClient.js)"
echo "2. Replace large lists with VirtualizedComponents"
echo "3. Add performance monitoring to your app entry point"
echo "4. Configure Redis for backend caching"
echo "5. Run 'npm run build' to test bundle optimizations"
echo ""
echo "📊 PERFORMANCE ANALYSIS:"
echo "========================"
echo "• Run 'ANALYZE=true npm run build' to analyze bundle size"
echo "• Open browser devtools to see Web Vitals metrics"
echo "• Check React Query devtools in development"
echo ""
echo "🎉 Performance optimization setup complete!"
