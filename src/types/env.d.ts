declare interface ImportMeta {
  readonly env: {
    // Vite built-in environment variables
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly MODE: string;
    readonly BASE_URL: string;
    readonly SSR: boolean;

    // Environment variables defined in .env
    readonly VITE_UNSPLASH_ACCESS_KEY: string;
    readonly VITE_GITHUB_CLIENT_ID: string;
    readonly VITE_API_ENDPOINT: string;
    readonly VITE_API2_ENDPOINT: string;
    readonly VITE_OPENAI_API_KEY: string;
    readonly VITE_TTS_KEY: string;
    readonly VITE_TTS_REGION: string;
  };
}
