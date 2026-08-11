import env, { AUTH_ORIGIN } from '#start/env';
import { defineConfig, services } from '@adonisjs/ally';

const callbackBase = `${AUTH_ORIGIN}/_/auth/callback`;

const allyConfig = defineConfig({
  github: services.github({
    clientId: env.get('GITHUB_CLIENT_ID')!,
    clientSecret: env.get('GITHUB_CLIENT_SECRET')!,
    callbackUrl: `${callbackBase}/github`,
    scopes: ['read:user', 'user:email'],
  }),
  google: services.google({
    clientId: env.get('GOOGLE_CLIENT_ID')!,
    clientSecret: env.get('GOOGLE_CLIENT_SECRET')!,
    callbackUrl: `${callbackBase}/google`,

    // Google specific
    prompt: 'select_account',
    accessType: 'offline',
    hostedDomain: 'nvp.gg',
    display: 'page',
    scopes: ['userinfo.email'],
  }),
  twitter: services.twitter({
    clientId: env.get('TWITTER_CLIENT_ID')!,
    clientSecret: env.get('TWITTER_CLIENT_SECRET')!,
    callbackUrl: `${callbackBase}/twitter`,
    // Twitter doesn't support scopes
    //scopes: ['email'],
  }),
});

export default allyConfig;

declare module '@adonisjs/ally/types' {
  interface SocialProviders extends InferSocialProviders<typeof allyConfig> {}
}
