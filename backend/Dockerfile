FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY scripts ./scripts
COPY src ./src
RUN npm run build

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

# Uploads vivem num volume; o diretório precisa existir e pertencer ao usuário node.
RUN mkdir -p /app/uploads && chown -R node:node /app
USER node

EXPOSE 3001
# Migrations rodam a cada boot: são idempotentes e o registro em _migrations
# garante que uma já aplicada nunca roda de novo.
CMD ["sh", "-c", "npm run migrate:prod && node dist/index.js"]
