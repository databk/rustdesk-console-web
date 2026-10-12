FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .
ARG SOURCE_COMMIT
ENV SOURCE_COMMIT=$SOURCE_COMMIT

# 发布流程传入本次提交链接，用于镜像中的对应源码声明。
ARG WEB_CLIENT_SOURCE_URL
# npm ci 时尚未复制项目配置；重新生成完整的 Umi 开发类型供检查使用。
RUN npm run postinstall && npm run build

FROM nginx:alpine
ARG SOURCE_COMMIT
LABEL org.opencontainers.image.revision=$SOURCE_COMMIT

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
