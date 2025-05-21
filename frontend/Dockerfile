FROM node:18-alpine

WORKDIR /app

# Install necessary packages
RUN apk add --no-cache curl

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies and serve package globally
# Ensure dependencies are properly installed
RUN npm ci
RUN npm install -g serve react-scripts

# Copy code into container
COPY . .

# Build the app
RUN NODE_OPTIONS=--max_old_space_size=2048 npm run build

# Expose port 8080 for DigitalOcean
EXPOSE 8080

# Add express for the server.js fallback
RUN npm install express

# Create a health check for DigitalOcean readiness probe
COPY public/health.json /app/build/health.json
HEALTHCHECK --interval=5s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health.json || exit 1

# Start with serve, but if that fails, use the express server as fallback
CMD ["sh", "-c", "serve -s build -l 8080 || node server.js"]
