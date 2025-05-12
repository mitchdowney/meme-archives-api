# meme-archives-api

Backend API for the searchable meme gallery. Provides endpoints for managing media, tags, collections, and more.

## Prerequisites

- Node.js (use the version specified in `.nvmrc`)
- Docker
- meme-archives-ops
- AWS S3

## Env vars

See the `.env.example` file for more information on required environment variables.

## Setup

Install dependencies:

```sh
npm install
```

Build the project:

```sh
npm run build
```

Run the API for local development:

```sh
npm run dev
```

Run the API for local development with a file watcher:

```sh
npm run dev:watch
```