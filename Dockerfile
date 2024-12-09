FROM --platform=linux/amd64 node:22-alpine

WORKDIR /app
ENV NODE_ENV development
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install

COPY . .

RUN pnpm prisma generate
RUN pnpm prisma migrate
RUN pnpm run build

EXPOSE 3000

ENTRYPOINT [ "pnpm", "start:dev" ]