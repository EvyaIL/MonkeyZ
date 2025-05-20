FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies and serve package globally
RUN npm ci && npm install -g serve react-scripts

# Copy code into container
COPY . .

# Build the app
RUN npm run build

# Expose port 8080 for DigitalOcean
EXPOSE 8080

# Use serve to run the built app (production)
CMD ["serve", "-s", "build", "-l", "8080"]
