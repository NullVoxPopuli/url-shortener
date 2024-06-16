import Fastify from "fastify";

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { setupAuth } from "./auth.js";
import { setupSubscriptions } from "./subscription.js";

import { PORT, DATABASE_URL } from "./env.js";

const here = dirname(fileURLToPath(import.meta.url));
const assets = join(here, "public");

/**
 * NOTE:
 *  http => https conversion is handled by Cloudflare,
 *  the DNS provider
 */
const f = Fastify({ logger: true });

setupAuth(f);
setupSubscriptions(f);
f.register(import("@fastify/view"), {
  root: assets,
  engine: {
    ejs: await import("ejs"),
  },
});
f.register(import("@fastify/static"), { root: assets });
f.register(import("@fastify/postgres"), {
  pg,
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

f.register(import("@fastify/formbody"));
f.register(import("@fastify/rate-limit"), { max: 100 });

f.register(import("./routes/+home.js"));
f.register(import("./routes/+api.js"));
f.register(import("./routes/+lo-fi.js"));
f.register(import("./routes/:id.js"));

/**
 * Run the server!
 */
const start = async () => {
  try {
    // Didn't take long for us to run in to a TS problem
    // @ts-expect-error
    f.listen({ port: PORT, host: "0.0.0.0" });
  } catch (err) {
    f.log.error(err);
    process.exit(1);
  }
};
start();
