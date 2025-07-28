FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent code
COPY agent/ ./agent/

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Cloud Run expects a web server, so we'll create a simple HTTP server
# that also runs the LiveKit agent
EXPOSE 8080
ENV PORT=8080

# Run the agent with start command (now includes health check server)
CMD ["python", "agent/minimal_agent.py", "start"]