pnpm concurrently \
  "pnpm rebuild node-gyp" \
  "pnpm rebuild better-sqlite3" \
  "pnpm exec playwright install" \
  --names "node-gyp,better-sqlite3,playwright" \
  --prefix-colors "auto"
