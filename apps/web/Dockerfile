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

# Build with placeholders that will be replaced from docker env at runtime
RUN echo "VITE_API_BASE_URL=__VITE_API_BASE_URL__" > apps/web/.env.production && \
  echo "VITE_SIGNALR_URL=__VITE_SIGNALR_URL__" >> apps/web/.env.production && \
  echo "VITE_ENVIRONMENT=__VITE_ENVIRONMENT__" >> apps/web/.env.production && \
  echo "VITE_KEYCLOAK_URL=__VITE_KEYCLOAK_URL__" >> apps/web/.env.production && \
  echo "VITE_KEYCLOAK_CLIENT_ID=__VITE_KEYCLOAK_CLIENT_ID__" >> apps/web/.env.production && \
  echo "VITE_REDIRECT_URI=__VITE_REDIRECT_URI__" >> apps/web/.env.production && \
  echo "VITE_POST_LOGOUT_REDIRECT_URI=__VITE_POST_LOGOUT_REDIRECT_URI__" >> apps/web/.env.production && \
  echo "VITE_FB_APP_ID=__VITE_FB_APP_ID__" >> apps/web/.env.production

# Build
RUN cd apps/web && npx vite build

# Production — Nginx
FROM nginx:alpine AS final
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
# Use nginx template + envsubst at container start to inject docker env values
COPY apps/web/nginx.conf /etc/nginx/templates/default.conf.template
COPY apps/web/docker-entrypoint/40-replace-vite-env.sh /docker-entrypoint.d/40-replace-vite-env.sh
RUN chmod +x /docker-entrypoint.d/40-replace-vite-env.sh
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
