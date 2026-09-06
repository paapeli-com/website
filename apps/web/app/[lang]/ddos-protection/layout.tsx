import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/ddos-protection");

export default function DdosProtectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
