FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# 发布流程传入本次提交链接，用于镜像中的对应源码声明。
ARG WEB_CLIENT_SOURCE_URL=https://github.com/yardbirds0/rustdesk-console-web/tree/web-client-v2-acceptance
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
