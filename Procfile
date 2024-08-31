release: cd api && node ./build/ace migration:run --force
web: cd api/build && pnpm prune --prod && node --optimize_for_size --max_old_space_size=460 --gc_interval=100 ./bin/server.js
