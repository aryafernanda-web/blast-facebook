FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV HEADLESS=true

CMD ["npm", "start"]
