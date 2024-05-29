FROM node:20
WORKDIR /tmp
COPY . .
RUN apt-get update && apt-get install -y ffmpeg
RUN npm install
RUN npm run build
