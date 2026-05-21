# Stage 1: install dependencies
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* yarn.lock* ./
RUN npm install --omit=dev --frozen-lockfile 2>/dev/null \
    || npm install --omit=dev

# Stage 2: production image
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy installed modules and source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
