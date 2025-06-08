/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** バックエンドのURL (CORSのAllow-Originに使用) */
  readonly VITE_BACKEND_URL: string

  /** 認証エンドポイントのドメイン */
  readonly VITE_AUTH_DOMAIN: string

  /** OAuth2.0 クライアントID */
  readonly VITE_AUTH_CLIENT_ID: string

  /** JWTに載るaudの値 */
  readonly VITE_AUTH_AUDIENCE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
