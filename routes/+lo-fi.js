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
  f.post("/lofi/add", (req, res) => {
    return "shorten a URL";
  });
}
