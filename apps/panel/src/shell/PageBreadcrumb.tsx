import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { navTrail } from "@/shell/nav/resolveNavEntry";
import { useShellT } from "@/shared/i18n/shell";
import { cn } from "@/shared/lib/utils";

/* The trail above a product's own pages — "Smart Factory › Location" — so
   every page says where it is, as the forms and detail pages already did.
   It draws nothing on a page the sidebar doesn't name: those carry their
   own, more specific breadcrumb. Same look as theirs. */
export function PageBreadcrumb({ className }: { className?: string }) {
  const { pathname } = useLocation();
  const t = useShellT();
  const trail = navTrail(pathname);
  if (!trail) return null;

  return (
    <nav aria-label="breadcrumb" className={cn("mb-3", className)}>
      <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5">
        {trail.map((crumb, i) => {
          const last = i === trail.length - 1;
          return (
            <Fragment key={`${crumb.title}-${i}`}>
              {i > 0 && (
                <li role="presentation" aria-hidden className="[&>svg]:size-3.5">
                  <ChevronRight className="rtl:rotate-180" />
                </li>
              )}
              <li className="inline-flex items-center gap-1.5">
                {last ? (
                  <span aria-current="page" className="font-normal text-foreground">{t(crumb.title)}</span>
                ) : crumb.path ? (
                  <Link to={crumb.path} className="transition-colors hover:text-foreground">{t(crumb.title)}</Link>
                ) : (
                  <span>{t(crumb.title)}</span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
