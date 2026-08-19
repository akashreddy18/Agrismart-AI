# --- Stage 1: Build the static production bundle ---
FROM node:20-alpine AS builder

WORKDIR /frontend

# Copy dependency configs
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# --- Stage 2: Serve the static files using Nginx ---
FROM nginx:alpine

# Copy compiled assets from builder stage
COPY --from=builder /frontend/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
