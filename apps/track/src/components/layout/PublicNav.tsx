import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import paapeliLogo from "@paapeli/brand/logo.svg";
import { useBrand } from "@/brand/BrandProvider";
import { LanguageMenu } from "./LanguageMenu";

/* Public marketing header shown on the login page — matches the main   */
/* Paapeli site header so the sign-in experience is unified across all   */
/* products (a cloud provider has one login, one nav).                   */
const LINKS: { label: string; caret?: boolean }[] = [
  { label: "Products", caret: true },
  { label: "Use Cases", caret: true },
  { label: "Docs", caret: true },
  { label: "Pricing" },
  { label: "Blog" },
];

export function PublicNav() {
  const { brand } = useBrand();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 lg:px-6">
        <button onClick={() => navigate("/")} className="flex shrink-0 items-center gap-2">
          <img src={paapeliLogo} alt="Paapeli" className="h-8 w-auto" />
          <span className="text-xl font-bold text-primary">{brand.appName}</span>
        </button>

        <nav className="hidden flex-1 items-center gap-6 lg:flex">
          {LINKS.map((l) => (
            <button key={l.label} className="flex items-center gap-1 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground">
              {l.label}
              {l.caret && <ChevronDown className="size-4" />}
            </button>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-3">
          <LanguageMenu withLabel />
          <button
            onClick={() => navigate("/")}
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Dashboard
          </button>
        </div>
      </div>
    </header>
  );
}
