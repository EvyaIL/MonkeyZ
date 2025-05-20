FROM python:3.10-slim

WORKDIR /app

# Install build dependencies for cryptography
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc6-dev \
    libffi-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy code into container
COPY . .

# Expose port
EXPOSE 8000

# Command to run the server
# Bind to port 8000 (or $PORT if provided by DigitalOcean)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
