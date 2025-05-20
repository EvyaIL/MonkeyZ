FROM python:3.10-slim

WORKDIR /app

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
