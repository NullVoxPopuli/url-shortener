import env from '#start/env'
import { defineConfig, services } from '@adonisjs/ally'

const allyConfig = defineConfig({
  github: services.github({
    clientId: env.get('GITHUB_CLIENT_ID')!,
    clientSecret: env.get('GITHUB_CLIENT_SECRET')!,
    callbackUrl: `${env.get('HOST')}/auth/callback/github`,
  }),
  google: services.google({
    clientId: env.get('TWITTER_CLIENT_ID')!,
    clientSecret: env.get('TWITTER_CLIENT_SECRET')!,
    callbackUrl: `${env.get('HOST')}/auth/callback/google`,

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
    callbackUrl: `${env.get('HOST')}/auth/callback/x`,
  }),
})

export default allyConfig

declare module '@adonisjs/ally/types' {
  interface SocialProviders extends InferSocialProviders<typeof allyConfig> {}
}
