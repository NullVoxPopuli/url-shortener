import { selectExact, selectStartingWith } from "./db.js";

export default async function routes(f, options) {
  f.get("/:abbr", async (req, reply) => {
    console.log(req.url, req.params);

    let abbr = req.params.abbr;
    let client;
    let result;

    try {
      client = await fastify.pg.connect();

      if (abbr.length === 36) {
        result = await selectExact(abbr, client);
      } else {
        result = await selectStartingWith(abbr, client);
      }
      return result;
    } finally {
      // Release the client immediately after query resolves, or upon error
      client.release();
    }
  });
}
