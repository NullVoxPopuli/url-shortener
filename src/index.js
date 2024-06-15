import Fastify from "fastify";

import assert from "node:assert";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const PORT = process.env.PORT || 5001;
const DATABASE_URL = process.env.DATABASE_URL;

assert(DATABASE_URL, "DATABASE_URL must be set");

const here = dirname(fileURLToPath(import.meta.url));
const assets = join(here, "public");

const d = async (m) => (await import(m)).default;

/**
 * NOTE:
 *  http => https conversion is handled by Cloudflare,
 *  the DNS provider
 */
const f = Fastify({ logger: true });

f.register(await d("@fastify/view"), {
  root: assets,
  engine: {
    ejs: await d("ejs"),
  },
});
f.register(await d("@fastify/static"), { root: assets });
f.register(await d("@fastify/postgres"), {
  pg,
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
f.register(await d("@fastify/formbody"));
f.register(await d("@fastify/rate-limit"), { max: 100 });

f.register(await d("./routes/+home.js"));
f.register(await d("./routes/+api.js"));
f.register(await d("./routes/+lo-fi.js"));
f.register(await d("./routes/:id.js"));

/**
 * Run the server!
 */
const start = async () => {
  try {
    f.listen({ port: PORT, host: "0.0.0.0" });
  } catch (err) {
    f.log.error(err);
    process.exit(1);
  }
};
start();
