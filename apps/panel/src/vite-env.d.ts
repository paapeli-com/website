/// <reference types="vite/client" />

/* The PAAPELI_*-prefixed vars vite.config.ts exposes to client code. Optional
   because a build with no .env is supported — src/shared/config.ts falls back. */
interface ImportMetaEnv {
  readonly PAAPELI_API_BASE_URL?: string;
  readonly PAAPELI_MAPIR_API_KEY?: string;
  readonly PAAPELI_STAGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "factory/FactoryApp" {
  const FactoryApp: React.ComponentType;
  export default FactoryApp;
}

declare module "track/TrackApp" {
  const TrackApp: React.ComponentType;
  export default TrackApp;
}

declare module "cloudManagement/CloudManagementApp" {
  const CloudManagementApp: React.ComponentType;
  export default CloudManagementApp;
}
