import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/careers");

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
