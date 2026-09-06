import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/aiot-platform");

export default function AiotPlatformLayout({ children }: { children: React.ReactNode }) {
  return children;
}
