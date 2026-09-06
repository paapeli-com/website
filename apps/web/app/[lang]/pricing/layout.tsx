import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/pricing");

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
