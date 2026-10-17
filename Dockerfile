# The web console is a static site built once in CI (see .github/workflows).
# Copy the prebuilt dist/ directory into the runtime image so the release
# archive and the Docker image ship byte-identical assets. The base image is
# multi-arch, so no QEMU-emulated npm build is needed for linux/arm64.
FROM nginx:alpine

ARG SOURCE_COMMIT
LABEL org.opencontainers.image.revision=$SOURCE_COMMIT

COPY dist/ /usr/share/nginx/html/
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
