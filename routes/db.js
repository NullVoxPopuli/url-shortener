export async function selectExact(abbr, client) {
  return await client.query(
    `
      SELECT * FROM "links"
      WHERE 
        "links.abbr" = "$1"
    `,
    [abbr],
  );
}

export async function selectStartingWith(abbr, client) {
  return await client.query(
    `
      SELECT * FROM "links"
      WHERE
        "links.abbr" LIKE "$1%"
    `,
    [abbr],
  );
}
