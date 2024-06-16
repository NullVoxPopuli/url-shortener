import assert from "node:assert";

export async function pg(f, fn) {
  let client;

  try {
    client = await f.pg.connect();

    return await fn(client);
  } catch (e) {
    throw e;
  } finally {
    client?.release();
  }
}

export async function selectExact(client, uuid) {
  return await client.query(
    `
      SELECT * FROM "links"
      WHERE 
        id = $1
    `,
    [uuid],
  );
}

export async function createLink(client, url) {
  assert(url, "Cannot create a link mapping without an URL");

  const result = await client.query(
    `
    INSERT 
      INTO links (original, submitter) 
      VALUES($1, $2) 
      RETURNING id;
    `,
    [url, "test-user"],
  );

  if (result.rows.length < 1) {
    throw new Error(`Something went wrong when creating your link.`);
  }

  return result.rows[0].id;
}

export async function updateCount(client, id) {
  assert(id, "Cannot update a link without an ID");

  await client.query(
    `
    UPDATE links 
       SET visits = visits + 1
       WHERE id = $1
    `,
    [id],
  );
}
