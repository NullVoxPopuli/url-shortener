export function lofiRoutes(app) {
  app
    .get("/lofi/create", (req, res) => res.render("pages/create"))
    .post("/lofi/add", (req, res) => {});
}
