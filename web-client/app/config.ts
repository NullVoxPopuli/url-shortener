interface Config {
  environment: 'development' | 'production';
  locationType: 'history' | 'hash' | 'none' | 'auto';
  rootURL: string;
  apiOrigin: string;
  docsOrigin: string;
  EmberENV?: Record<string, unknown>;
  APP: Record<string, unknown> & { rootElement?: string; autoboot?: boolean };
}

const ENV: Config = {
  environment: import.meta.env.DEV ? 'development' : 'production',
  rootURL: '/',
  locationType: 'history',
  apiOrigin: import.meta.env.DEV ? 'http://api.nvp.local:5001' : 'https://api.nvp.gg',
  docsOrigin: import.meta.env.DEV ? 'http://docs.nvp.local:5001' : 'https://docs.nvp.gg',
  EmberENV: {},
  APP: {},
};

export default ENV;
