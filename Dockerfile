FROM node:20 AS build

WORKDIR /app

COPY package*.json ./

RUN yarn

COPY . .

RUN yarn build

FROM node:20

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

RUN yarn

EXPOSE 3000

CMD ["node", "dist/index.js"]