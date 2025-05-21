FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies and serve package globally
# Ensure react-scripts is installed both locally and globally to avoid issues
RUN npm ci && npm install -g serve react-scripts

# Copy code into container
COPY . .

# Build the app
RUN npm run build

# Expose port 8080 for DigitalOcean
EXPOSE 8080

# Create a health check for DigitalOcean readiness probe
RUN echo '{"status":"ok"}' > /app/build/health.json
HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=3 CMD wget -q -O- http://localhost:8080/health.json || exit 1

# Use serve to run the built app (production)
CMD ["serve", "-s", "build", "-l", "8080"]
