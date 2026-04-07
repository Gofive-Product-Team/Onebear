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
ARG VITE_API_BASE_URL=http://localhost:5000
ARG VITE_KEYCLOAK_URL=https://auth-nonprod.gofive.co.th/auth/realms/onebear-dev
ARG VITE_KEYCLOAK_CLIENT_ID=onebear-spa
ARG VITE_REDIRECT_URI=http://localhost:5173/auth/callback
ARG VITE_POST_LOGOUT_REDIRECT_URI=http://localhost:5173

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
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
