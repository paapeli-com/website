import { metadataForRoute } from "@/lib/route-metadata";

export const generateMetadata = metadataForRoute("/contact");

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
