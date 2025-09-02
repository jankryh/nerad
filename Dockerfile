# Multi-stage build pro React aplikaci
FROM node:18-alpine AS builder

# Nastavení pracovního adresáře
WORKDIR /app

# Kopírování package.json a package-lock.json
COPY package*.json ./

# Instalace všech závislostí (včetně dev dependencies pro build)
RUN npm ci

# Kopírování zdrojového kódu
COPY . .

# Build produkční verze s omezenou pamětí
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build

# Produkční stage s Nginx
FROM nginx:alpine

# Kopírování build souborů do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Kopírování Nginx konfigurace
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponování portu 80
EXPOSE 80

# Spuštění Nginx
CMD ["nginx", "-g", "daemon off;"]
