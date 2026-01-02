FROM oven/bun AS build
WORKDIR /app
COPY ./package.json bun.lock ./
RUN bun i
COPY . .
ARG API_URL
ENV VITE_API_URL=${API_URL}
RUN bun run build

FROM joseluisq/static-web-server:2
WORKDIR /app
COPY --from=build /app/dist /dist

EXPOSE 3001
CMD [ "--root", "/dist", "--port=3001" ]
