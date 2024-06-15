import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 5001;

import { abbrRoute } from "./routes/:abbr.js";
import { lofiRoutes } from "./routes/+lo-fi.js";
import { errorRoutes } from "./routes/+errors.js";

/**
 * NOTE:
 *  http => https conversion is handled by Cloudflare,
 *  the DNS provider
 */
const app = express()
  .set("views", join(__dirname, "views"))
  .set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index.ejs", { title: "Hey", message: "Hello there!" });
  res.end();
});

lofiRoutes(app);
abbrRoute(app);
//errorRoutes(app);

app.use(express.static(join(__dirname, "public")));
app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
