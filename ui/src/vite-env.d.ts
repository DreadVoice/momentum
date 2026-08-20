/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the Spring Boot API. Must appear in CORS_ALLOWED_ORIGINS. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
