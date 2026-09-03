FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=http://localhost:8080/api
ARG VITE_DEMO_MODE=true
ARG VITE_DEMO_PASSWORD=123456
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_DEMO_MODE=$VITE_DEMO_MODE
ENV VITE_DEMO_PASSWORD=$VITE_DEMO_PASSWORD
RUN npm run build
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
