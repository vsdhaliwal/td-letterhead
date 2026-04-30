FROM node:20-bookworm-slim AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:20-bookworm-slim AS runner

WORKDIR /app

RUN apt-get -o Acquire::https::Verify-Peer=false -o Acquire::https::Verify-Host=false update && \
    apt-get install -y --no-install-recommends --allow-unauthenticated \
      ca-certificates \
      gnupg \
      debian-archive-keyring \
      libreoffice \
      fonts-dejavu-core && \
    rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV SOFFICE_PATH=/usr/bin/soffice
ENV LETTERHEAD_TEMPLATE_PATH=/app/letterhead-template.pdf

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]