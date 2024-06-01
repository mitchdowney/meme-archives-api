FROM node:20

WORKDIR /tmp

COPY . .

# Install Python, pip and rembg
RUN apt-get update && apt-get install -y ffmpeg python3 python3-pip && \
    pip3 install rembg filetype watchdog aiohttp gradio asyncer

RUN npm install

RUN npm run build
