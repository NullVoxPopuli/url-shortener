FROM node:22.6.0-alpine3.20 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# All deps stage
FROM base AS deps
WORKDIR /everything
ADD . .
RUN pnpm install

# Production only deps stage
FROM base AS production-deps
WORKDIR /everything
ADD . .
RUN pnpm install --prod

# Build stage
FROM base AS build
WORKDIR /everything
# This is way less than what dev node modules are installed.
# But the other packages aren't relevant here as we're
# only building the API
COPY --from=deps /everything/node_modules /everything/node_modules
COPY --from=deps /everything/api/node_modules /everything/api/node_modules
ADD . .
RUN cd api && node ace build

# Production stage
FROM base
ENV NODE_ENV=production
WORKDIR /app
COPY --from=production-deps /everything/api/node_modules /app/node_modules
COPY --from=build /everything/api/build /app
EXPOSE 5001
CMD ["node", "./bin/server.js"]
