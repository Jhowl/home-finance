FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm install

COPY . .

RUN cd client && npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
