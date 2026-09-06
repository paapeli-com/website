import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/features/solution-templates");

export default function FeaturesSolutionTemplatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
