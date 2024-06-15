import express from "express";
import path from "node:path";

const PORT = process.env.PORT || 5001;

express()
  .use(express.static(path.join(__dirname, "public")))
  .get("/", (req, res) => res.render("pages/index"))
  .listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
  });
