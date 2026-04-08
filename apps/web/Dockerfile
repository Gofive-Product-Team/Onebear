FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY libs/shared-types/package.json libs/shared-types/
COPY libs/ui/package.json libs/ui/

# Install dependencies
RUN npm ci

# Copy source
COPY apps/web/ apps/web/
COPY libs/ libs/
COPY tsconfig.base.json nx.json ./

# Build args for environment-specific config
# Build args — MUST be provided via docker build --build-arg or docker-compose args
ARG VITE_API_BASE_URL
ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_CLIENT_ID=onebear-spa
ARG VITE_REDIRECT_URI
ARG VITE_POST_LOGOUT_REDIRECT_URI

# Write env file from build args
RUN echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" > apps/web/.env.production && \
    echo "VITE_KEYCLOAK_URL=${VITE_KEYCLOAK_URL}" >> apps/web/.env.production && \
    echo "VITE_KEYCLOAK_CLIENT_ID=${VITE_KEYCLOAK_CLIENT_ID}" >> apps/web/.env.production && \
    echo "VITE_REDIRECT_URI=${VITE_REDIRECT_URI}" >> apps/web/.env.production && \
    echo "VITE_POST_LOGOUT_REDIRECT_URI=${VITE_POST_LOGOUT_REDIRECT_URI}" >> apps/web/.env.production

# Build
RUN cd apps/web && npx vite build

# Production — Nginx
FROM nginx:alpine AS final
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
# Use nginx template + envsubst at container start to inject docker env values
COPY apps/web/nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
