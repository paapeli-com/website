import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/features/flexible-deployment");

export default function FeaturesFlexibleDeploymentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
