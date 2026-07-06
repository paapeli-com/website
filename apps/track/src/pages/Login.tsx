import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBrand } from "@/brand/BrandProvider";
import { Button } from "@/components/ui/button";
import { LanguageMenu } from "@/components/layout/LanguageMenu";
import { MapCanvas } from "@/components/map/MapCanvas";
import { DEVICES, GEOFENCES } from "@/data/mockData";

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const { brand } = useBrand();
  const navigate = useNavigate();
  const [email, setEmail] = useState("demo@paapeli.com");
  const [password, setPassword] = useState("demo");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
    navigate("/");
  };

  return (
    <div className="flex min-h-screen">
      {/* Form side */}
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-12 lg:w-[46%]">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                {brand.logoText}
              </span>
              <span className="text-lg font-semibold">{brand.appName}</span>
            </div>
            <LanguageMenu />
          </div>

          <h1 className="text-2xl font-bold">{t("welcomeBack")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("signInSubtitle")}</p>

          <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t("email")}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t("password")}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </label>
            <Button type="submit" size="lg" className="mt-2">{t("signIn")}</Button>
            <p className="text-center text-xs text-muted-foreground">{t("demoHint")}</p>
          </form>
        </div>
      </div>

      {/* Visual side */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-primary/5 p-10 lg:flex">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        <MapCanvas
          devices={DEVICES}
          geofences={GEOFENCES}
          className="aspect-[4/3] w-full max-w-xl shadow-2xl"
        />
      </div>
    </div>
  );
}
