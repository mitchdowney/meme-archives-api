FROM node:20

WORKDIR /tmp

COPY . .

# Install Python, pip and rembg
RUN apt-get update && apt-get install -y ffmpeg python3 python3-pip python3-venv && \
    python3 -m venv /opt/venv && \
    . /opt/venv/bin/activate && \
    pip install rembg filetype watchdog aiohttp gradio asyncer

RUN npm install

RUN npm run build
