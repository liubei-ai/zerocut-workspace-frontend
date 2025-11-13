declare interface ImportMeta {
  readonly env: {
    // Vite built-in environment variables
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly MODE: string;
    readonly BASE_URL: string;
    readonly SSR: boolean;

    // Environment variables defined in .env
    readonly VITE_API_BASE_URL: string;
    readonly VITE_API2_BASE_URL: string;
    // Removed legacy variables: VITE_OPENAI_API_KEY, VITE_TTS_KEY, VITE_TTS_REGION
  };
}
