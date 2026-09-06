import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/features/device-management");

export default function FeaturesDeviceManagementLayout({ children }: { children: React.ReactNode }) {
  return children;
}
