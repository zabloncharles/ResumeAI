/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_AI_FUNCTIONS_BASE?: string
}
 
interface ImportMeta {
  readonly env: ImportMetaEnv
} 