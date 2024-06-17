import env from '#start/env';
import { defineConfig, services } from '@adonisjs/ally';

const baseUrl =
  env.get('NODE_ENV') === 'development' ? 'localhost:5001' : 'https://nvp.gg/_/auth/callback';

const allyConfig = defineConfig({
  github: services.github({
    clientId: env.get('GITHUB_CLIENT_ID')!,
    clientSecret: env.get('GITHUB_CLIENT_SECRET')!,
    callbackUrl: `${baseUrl}/github`,
    scopes: ['user:email'],
  }),
  google: services.google({
    clientId: env.get('TWITTER_CLIENT_ID')!,
    clientSecret: env.get('TWITTER_CLIENT_SECRET')!,
    callbackUrl: `${baseUrl}/google`,

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
    callbackUrl: `${baseUrl}/twitter`,
    // Twitter doesn't support scopes
    //scopes: ['email'],
  }),
});

export default allyConfig;

declare module '@adonisjs/ally/types' {
  interface SocialProviders extends InferSocialProviders<typeof allyConfig> {}
}
