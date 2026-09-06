FROM docker.arvancloud.ir/node:20-alpine
# FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build \
  && npm prune --omit=dev

# Container listens on 3006 (override with PORT env if needed).
ENV PORT=3006
ENV NODE_ENV=production

# Exec form so node is PID 1 and receives SIGTERM directly.
# Nest emits to dist/src/ when sourceRoot is `src`.
CMD ["node", "dist/src/main.js"]

EXPOSE 3006
