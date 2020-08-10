#syntax=docker/dockerfile:experimental

FROM node:13.7.0-alpine3.10 as builder

# ARG REACT_APP_GOOGLE_KEY=xxx.xxx.xxx.xxx
# ENV REACT_APP_GOOGLE_KEY=$REACT_APP_GOOGLE_KEY

WORKDIR '/app'

COPY ./package.json ./
RUN npm install

COPY . .

RUN --mount=type=cache,target=/root/.cache/npm npm run build

FROM nginx
EXPOSE 3000

COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/build /usr/share/nginx/html