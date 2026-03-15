# Multi-stage build pro React aplikaci
FROM docker.io/library/node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .

ENV NODE_OPTIONS="--max-old-space-size=2048"
ARG VITE_PID_API_BASE_URL=/api
ENV VITE_PID_API_BASE_URL=$VITE_PID_API_BASE_URL

RUN npm run build

FROM docker.io/library/nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
