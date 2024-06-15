import { selectExact, selectStartingWith } from "./db.js";

export default async function routes(f, options) {
  f.get("/:abbr", async (req, reply) => {
    console.log(req.url, req.params);

    let abbr = req.params.abbr;
    let client;
    let result;

    try {
      client = await f.pg.connect();

      if (abbr.length === 36) {
        result = await selectExact(client, abbr);
      } else {
        result = await selectStartingWith(client, abbr);
      }

      if (result.rows.length !== 0) {
        // TODO: 404
        throw new Error("Not found");
      }

      let row = result.rows[0];

      return reply.redirect(row.original);
    } finally {
      // Release the client immediately after query resolves, or upon error
      client.release();
    }
  });
}
