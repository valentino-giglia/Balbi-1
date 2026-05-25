FROM node:18-alpine

WORKDIR /app

COPY balbi-back/package*.json ./

RUN npm install --production

COPY balbi-back/ ./

EXPOSE 3000

CMD ["node", "server.js"]
