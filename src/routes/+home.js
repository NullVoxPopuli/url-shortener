export default async function routes(f, options) {
  f.get("/", (req, reply) => {
    return reply.sendFile("index.html");
  });
}
