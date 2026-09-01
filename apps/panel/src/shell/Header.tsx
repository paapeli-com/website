import { Menu, Moon, Sun } from "lucide-react";
import paapeliLogo from "@paapeli/brand/logo.svg";
import paapeliLogoDark from "@paapeli/brand/logo-dark.svg";
import { useBrand } from "@/shell/BrandProvider";
import { useShellT } from "@/shared/i18n/shell";
import { useTheme } from "@paapeli/brand/theme";
import { ProductSwitcher } from "./ProductSwitcher";
import { HeaderSearch } from "./HeaderSearch";
import { CreateNewMenu } from "./CreateNewMenu";
import { NotificationsMenu } from "./NotificationsMenu";
import { WalletMenu } from "./WalletMenu";
import { AccountMenu } from "./AccountMenu";
import { LanguageMenu } from "./LanguageMenu";

const iconBtn =
  "inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export function Header({ onMenu }: { onMenu: () => void }) {
  const { brand } = useBrand();
  const { dark, toggle } = useTheme();
  const t = useShellT();

  return (
    <header className="z-40 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-3 lg:px-4">
      <button onClick={onMenu} className={iconBtn} aria-label={t("Toggle sidebar")}>
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex shrink-0 items-center gap-2">
        <img src={paapeliLogo} alt="Paapeli" className="block h-7 w-auto dark:hidden" />
        <img src={paapeliLogoDark} alt="Paapeli" className="hidden h-7 w-auto dark:block" />
        <span className="hidden text-lg font-bold leading-none text-primary sm:inline">{brand.appName}</span>
      </div>

      <HeaderSearch />

      <div className="hidden md:block">
        <ProductSwitcher />
      </div>

      <div className="ms-auto flex items-center gap-1">
        <CreateNewMenu />

        <span className="hidden h-6 w-px bg-border sm:mx-1 sm:block" aria-hidden />

        <button onClick={toggle} className={iconBtn} aria-label={t("Toggle dark mode")}>
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <LanguageMenu />

        <NotificationsMenu />

        <WalletMenu />

        <AccountMenu />
      </div>
    </header>
  );
}
