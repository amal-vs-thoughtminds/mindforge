FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

USER node
EXPOSE 4000

# Apply pending migrations, then start the API.
CMD ["sh", "-c", "npx sequelize-cli db:migrate && node src/server.js"]
