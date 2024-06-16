export default async function routes(f, options) {
  /**
   * Actually creates the short URL
   */
  f.post("/api/link", (req, res) => {
    return "TODO: insert record";
  });

  f.get("/api/link/:abbr", (req, res) => {
    return "TODO: read-record";
  });
}
