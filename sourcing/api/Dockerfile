# sourcing/api/Dockerfile
FROM mcr.microsoft.com/devcontainers/javascript-node:20

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV PORT=3301
EXPOSE 3301
CMD ["node","src/index.js"]
