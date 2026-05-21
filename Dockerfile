FROM public.ecr.aws/docker/library/node:22.21-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    curl \
    procps \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm update -g npm 
RUN npm ci --omit=dev 
RUN npm install @nestjs/cli --save
COPY . .
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build
FROM public.ecr.aws/docker/library/node:22.21-slim AS development
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm update -g npm 
RUN npm install
COPY --from=builder /app/dist ./dist
USER node
ENV NODE_ENV=development
EXPOSE 4700 
ENV NODE_OPTIONS="--max-old-space-size=4096"
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "curl", "-f", "http://localhost:4700/v1/health-check" ] || exit 1
CMD [ "node", "dist/main.js" ]