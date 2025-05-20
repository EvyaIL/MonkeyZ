FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy code into container
COPY . .

# Expose port
EXPOSE 3000

# Start development server for local use
CMD ["npm", "start"]
