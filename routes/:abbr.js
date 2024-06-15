import { pool } from "./db.js";

export async function abbr(req, res) {
  let abbr = req.params.abbr;
  console.log(req.url);
  let client;
  let result;
  try {
    client = await pool.connect();

    if (abbr.length === 36) {
      const result = await client.query(
        `
          SELECT * FROM "links"
          WHERE 
            "abbr" = "$1"
        `,
        [abbr],
      );
    } else {
      //result = await client.query(
      //  `
      //  SELECT * FROM "links"
      //  WHERE
      //    "abbr" LIKE "$1%"
      //`,
      //  [abbr],
      //);
    }
    console.log(result);
    const results = { results: result ? result.rows : null };
    res.render(JSON.stringify(results));
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  } finally {
    client.release();
  }
}

export function abbrRoute(app) {
  app.get("/:abbr", abbr);
}
