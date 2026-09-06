import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/makers-developers");

export default function MakersDevelopersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
