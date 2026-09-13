# =============================================================================
# MediCare Hub – Frontend (Node build → Nginx serve)
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Build-time env (Vite embeds VITE_* at build time)
ARG VITE_API_URL=/api/v1
ARG VITE_WS_BASE_URL=
ARG VITE_APP_NAME=MediCare Hub
ENV VITE_API_URL=$VITE_API_URL \
    VITE_WS_BASE_URL=$VITE_WS_BASE_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_ENABLE_DEBUG=false

RUN npm run build


FROM nginx:1.27-alpine AS runner

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Non-root friendly (nginx user already exists in official image)
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
