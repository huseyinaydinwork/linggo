FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY public ./public
# SQLite database lives in a volume so it survives redeploys
VOLUME ["/app/data"]
EXPOSE 5173
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:5173/healthz || exit 1
# A database uploaded as data/import.db replaces the live one on the next start (one-time migration)
CMD ["sh", "-c", "if [ -f /app/data/import.db ]; then mv /app/data/import.db /app/data/pratilange.db && rm -f /app/data/pratilange.db-wal /app/data/pratilange.db-shm && echo 'DB imported'; fi; exec node --disable-warning=ExperimentalWarning server/index.js"]
