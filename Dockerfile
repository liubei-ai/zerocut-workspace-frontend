FROM node:lts-alpine as build-stage
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build:railway

FROM nginx:stable-alpine as production-stage
RUN rm /etc/nginx/conf.d/default.conf
RUN printf 'server {\n  listen 80;\n  server_name _;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n  location ~* \\.(?:jpg|jpeg|gif|png|svg|webp|ico|css|js|woff|woff2)$ {\n    expires max;\n    access_log off;\n  }\n}\n' > /etc/nginx/conf.d/default.conf
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
