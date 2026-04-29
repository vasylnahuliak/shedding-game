FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner

COPY deploy/oracle/frontend.nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/frontend/public /usr/share/nginx/html

EXPOSE 8080
