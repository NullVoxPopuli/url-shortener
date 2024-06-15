import Fastify from "fastify";

import assert from "node:assert";
import { dirname, join } from "node:path";
import { fileURLToPath } from "url";

const PORT = process.env.PORT || 5001;
const DATABASE_URL = process.env.DATABASE_URL;

assert(DATABASE_URL, "DATABASE_URL must be set");

const here = dirname(fileURLToPath(import.meta.url));
const assets = join(here, "public");
const d = async (modulePath) => (await import(modulePath)).default;

/**
 * NOTE:
 *  http => https conversion is handled by Cloudflare,
 *  the DNS provider
 */
const f = Fastify({ logger: true });

f.register(await d("@fastify/static"), { root: assets });
f.register(await d("@fastify/postgres"), { connectionString: DATABASE_URL });
f.register(await d("@fastify/formbody"));
f.register(await d("@fastify/rate-limit"), { max: 100 });

f.register(await d("./routes/+home.js"));
f.register(await d("./routes/+api.js"));
f.register(await d("./routes/+lo-fi.js"));
f.register(await d("./routes/:abbr.js"));

/**
 * Run the server!
 */
const start = async () => {
  try {
    await f.listen({ port: PORT, host: "0.0.0.0" });
  } catch (err) {
    f.log.error(err);
    process.exit(1);
  }
};
start();
