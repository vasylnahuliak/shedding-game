FROM node:22.22.2-bookworm-slim AS pruner
WORKDIR /app
COPY . .
RUN npx --yes turbo@2.9 prune shedding-game-backend --docker

FROM node:22.22.2-bookworm-slim AS installer
WORKDIR /app
ENV CI=1
COPY --from=pruner /app/out/json/ ./
COPY .npmrc ./
RUN npm ci

FROM node:22.22.2-bookworm-slim AS builder
WORKDIR /app
ENV CI=1
COPY --from=installer /app/ ./
COPY --from=pruner /app/out/full/ ./
COPY turbo.json tsconfig.base.json ./
RUN npx turbo run build --filter=shedding-game-backend
RUN npm prune --omit=dev

FROM node:22.22.2-bookworm-slim AS runner
WORKDIR /app/apps/backend
ENV NODE_ENV=production

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json
COPY --from=builder /app/packages/shared /app/packages/shared
COPY --from=builder /app/apps/backend /app/apps/backend

USER node
EXPOSE 3000

CMD ["npm", "run", "start"]
