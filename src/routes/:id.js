import { selectExact, updateCount } from "./db.js";
import { compressedUUID } from "../utils/uuid.js";

/**
 * @param {import('fastify').FastifyInstance} f
 */
export default async function routes(f, options) {
  f.get("/:id", async (req, reply) => {
    let id = req.params.id;
    let client;
    let result;
    let uuid;

    try {
      client = await f.pg.connect();

      // uuid v4
      if (id.length === 36) {
        uuid = id;
        result = await selectExact(client, id);
      } else {
        uuid = compressedUUID.decode(id);
        result = await selectExact(client, uuid);
      }

      if (result.rows.length === 0) {
        reply.status(404);

        return reply.viewAsync("404-id.ejs.html", {
          url: `${req.hostname}${req.url}`,
        });
      }

      let row = result.rows[0];

      reply.redirect(row.original);

      await updateCount(client, uuid);
    } finally {
      // Release the client immediately after query resolves, or upon error
      client.release();
    }
  });
}
