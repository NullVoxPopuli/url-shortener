import { compressedUUID } from "../utils/uuid.js";
import { createLink, pg } from "./db.js";

export default async function routes(f, options) {
  /**
   * UI for creating the short URL
   */
  f.get(
    "/lofi/create",
    {
      preValidation: f.authenticate,
    },
    (req, reply) => {
      console.log(req, f);
      return reply.sendFile("lofi/create.html");
    },
  );

  /**
   * Actually creates the short URL
   */
  f.post(
    "/lofi/add",
    {
      preValidation: f.authenticate,
    },
    async (req, reply) => {
      let { originalUrl } = req.body;

      if (!URL.canParse(originalUrl)) {
        // TODO: 422
        return "Cannot parse URL, check the URL";
      }

      return await pg(f, async (client) => {
        let id = await createLink(client, originalUrl);
        let shorter = compressedUUID.encode(id);

        return reply.viewAsync("lofi/success.ejs.html", {
          shortUrl: `${req.hostname}/${shorter}`,
        });
      });
    },
  );
}
