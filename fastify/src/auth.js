import { fastifyOauth2 } from "@fastify/oauth2";
import { COOKIE_SECRET } from "./env.js";

const cookieOptions = {
  path: "/",
  secure: true,
  sameSite: "lax",
  httpOnly: true,
};
/**
 * @param {import('fastify').FastifyInstance} f
 */
export function setupAuth(f) {
  f.register(import("@fastify/cookie"), {
    secret: COOKIE_SECRET,
    hook: "onRequest",
    parseOptions: cookieOptions,
  });

  setupGitHub(f);
  //setupGoogle(f);
}

/**
 * @param {import('fastify').FastifyInstance} f
 */
function setupGitHub(f) {
  const name = "github";

  const { OAUTH_GITHUB_CLIENT_ID, OAUTH_GITHUB_CLIENT_SECRET } = process.env;

  f.register(fastifyOauth2, {
    name: "github_oauth2",
    cookie: cookieOptions,
    credentials: {
      client: {
        id: OAUTH_GITHUB_CLIENT_ID,
        secret: OAUTH_GITHUB_CLIENT_SECRET,
      },
      auth: fastifyOauth2.GITHUB_CONFIGURATION,
    },
    // register a fastify url to start the redirect flow to the service provider's OAuth2 login
    startRedirectPath: `/login/${name}`,
    // service provider redirects here after user login
    callbackUri: `http://localhost:5001/login/${name}/callback`,
    //callbackUri: (req) =>
    //  `${req.protocol}://${req.hostname}/login/${name}/callback`,
  });

  // This is the new endpoint that initializes the OAuth2 login flow
  //f.get(`/login/${name}`, {}, (req, reply) => {
  //  f.github_oauth2.generateAuthorizationUri(
  //    req,
  //    reply,
  //    (err, authorizationEndpoint) => {
  //      if (err) console.error(err);
  //      reply.redirect(authorizationEndpoint);
  //    },
  //  );
  //});

  // The service provider redirect the user here after successful login
  f.get(`/login/${name}/callback`, async function (request, reply) {
    const { token } =
      await this.github_oauth2.getAccessTokenFromAuthorizationCodeFlow(request);

    console.log(token.access_token);

    // if later need to refresh the token this can be used
    // const { token: newToken } = await this.getNewAccessTokenUsingRefreshToken(token)

    reply.send({ access_token: token.access_token });
  });
}

/**
 * @param {import('fastify').FastifyInstance} f
 */
function setupGoogle(f) {
  const name = "google";
  const { OAUTH_GOOGLE_CLIENT_ID, OAUTH_GOOGLE_CLIENT_SECRET } = process.env;

  f.register(fastifyOauth2, {
    name: "google_oauth2",
    cookie: cookieOptions,
    credentials: {
      client: {
        id: OAUTH_GOOGLE_CLIENT_ID,
        secret: OAUTH_GOOGLE_CLIENT_SECRET,
      },
      auth: fastifyOauth2.GOOGLE_CONFIGURATION,
    },
    // register a fastify url to start the redirect flow to the service provider's OAuth2 login
    startRedirectPath: `/login/${name}`,
    // service provider redirects here after user login
    callbackUri: `http://localhost:5001/login/${name}/callback`,
    //callbackUri: (req) =>
    //  `${req.protocol}://${req.hostname}/login/${name}/callback`,
  });

  // This is the new endpoint that initializes the OAuth2 login flow
  f.get(`/login/${name}`, {}, (req, reply) => {
    f.google_oauth2.generateAuthorizationUri(
      req,
      reply,
      (err, authorizationEndpoint) => {
        if (err) console.error(err);
        reply.redirect(authorizationEndpoint);
      },
    );
  });

  // The service provider redirect the user here after successful login
  f.get(`/login/${name}/callback`, async function (request, reply) {
    const { token } =
      await this.google_oauth2.getAccessTokenFromAuthorizationCodeFlow(request);

    console.log(token.access_token);

    // if later need to refresh the token this can be used
    // const { token: newToken } = await this.getNewAccessTokenUsingRefreshToken(token)

    reply.send({ access_token: token.access_token });
  });
}
