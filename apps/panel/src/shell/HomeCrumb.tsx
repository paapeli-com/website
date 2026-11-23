import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useShellT } from "@/shared/i18n/shell";

/* The first step of every product page's breadcrumb, "Home ›", so the way
   back to the product list is one click from anywhere inside a product.
   Two <li>s, the link and its separator, to sit at the head of any
   breadcrumb <ol>. The separator is turned by CSS rather than read from the
   factory's language provider, so it works under every feature. */
export function HomeCrumb() {
  const t = useShellT();
  return (
    <>
      <li className="inline-flex items-center gap-1.5">
        <Link to="/Home" className="transition-colors hover:text-foreground">
          {t("Home")}
        </Link>
      </li>
      <li role="presentation" aria-hidden className="[&>svg]:size-3.5">
        <ChevronRight className="rtl:rotate-180" />
      </li>
    </>
  );
}
