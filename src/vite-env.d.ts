/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_BACKEND_PROXY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
