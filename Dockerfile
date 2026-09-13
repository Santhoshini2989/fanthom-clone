# Runs both the web app and the bot worker (pick with the start command).
# Playwright's image ships Chromium and every system library it needs, so the
# same image serves `npm run start:cloud` (web) and `npm run bot:cloud` (bot).
FROM mcr.microsoft.com/playwright:v1.63.0-noble

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    BOT_BROWSER_CHANNEL=chromium \
    STORAGE_DIR=/data/storage \
    BOT_PROFILE_DIR=/data/bot-profile

WORKDIR /app

# Install dependencies (dev deps included: tsx, prisma and next build need them)
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --include=dev

COPY . .
RUN npx prisma generate && npm run build:next

# /data is the persistent volume (recordings, clips, bot profile)
RUN mkdir -p /data/storage/recordings /data/storage/clips /data/storage/exports
VOLUME ["/data"]

EXPOSE 3000
CMD ["npm", "run", "start:cloud"]
