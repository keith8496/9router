FROM node:20-alpine AS deps

WORKDIR /app

RUN mkdir -p /app/data
COPY package*.json ./
RUN chown -R node:node /app

ENV HOME=/app/data
USER node
RUN npm ci

FROM node:20-alpine AS builder

WORKDIR /app

RUN mkdir -p /app/data
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN chown -R node:node /app/data
RUN chown -R node:node /app
ENV HOME=/app/data
USER node
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN mkdir -p /app/data
ENV NODE_ENV=production
ENV DATA_DIR=/app/data
ENV HOME=/app/data

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["npm", "run", "start"]
