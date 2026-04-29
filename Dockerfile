FROM node:20-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    fonts-dejavu-core \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

FROM node:20-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    fonts-dejavu-core \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV SOFFICE_PATH=/usr/bin/soffice
ENV LETTERHEAD_TEMPLATE_PATH=/app/letterhead-template.pdf

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
