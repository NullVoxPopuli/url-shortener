import { createLink, pg } from "./db.js";

export default async function routes(f, options) {
  /**
   * UI for creating the short URL
   */
  f.get("/lofi/create", (req, reply) => {
    return reply.sendFile("lofi/create.html");
  });

  /**
   * Actually creates the short URL
   */
  f.post("/lofi/add", async (req, reply) => {
    let { originalUrl } = req.body;

    if (!URL.canParse(originalUrl)) {
      // TODO: 422
      return "Cannot parse URL, check the URL";
    }

    return await pg(f, async (client) => {
      let id = await createLink(client, originalUrl);
      let shorter = id.split("-")[0];

      return reply.viewAsync("lofi/success.ejs.html", {
        shortUrl: `https://nvp.gg/${shorter}`,
      });
    });
  });
}
