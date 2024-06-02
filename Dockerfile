FROM nvidia/cuda:12.5.0-base-ubuntu22.04

WORKDIR /app

# Install base packages
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    python3-venv \
    curl

# Install Node.js
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Create a virtual environment
RUN python3 -m venv /opt/venv

# Copy requirements.txt and install Python dependencies
COPY ./requirements.txt .
RUN /bin/bash -c "source /opt/venv/bin/activate && pip install -r requirements.txt"

# Copy package.json and package-lock.json and install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build
