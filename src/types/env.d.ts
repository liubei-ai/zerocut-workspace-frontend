declare interface ImportMeta {
  readonly env: {
    // Vite built-in environment variables
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly MODE: string;
    readonly BASE_URL: string;
    readonly SSR: boolean;

    readonly VITE_API_BASE_URL: string;
    readonly VITE_API2_BASE_URL: string;

    readonly VITE_AUTH_MODE: 'auth0' | 'authing';
    readonly VITE_AUTHING_APP_ID: string;
    readonly VITE_AUTH0_DOMAIN: string;
    readonly VITE_AUTH0_CLIENT_ID: string;
    readonly VITE_AUTH0_CALLBACK_URL: string;
  };
}
