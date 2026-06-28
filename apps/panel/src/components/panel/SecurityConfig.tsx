import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AUTH_METHODS, generateAccessToken, type AuthMethod } from "@/lib/formOptions";
import { KeyRound, Lock, ShieldCheck, RefreshCw, Upload } from "lucide-react";

export interface SecurityValue {
  method: AuthMethod;
  accessToken: string;
  clientId: string;
  username: string;
  password: string;
  sslCert: string;
}

export const emptySecurity = (): SecurityValue => ({
  method: "accessToken",
  accessToken: generateAccessToken(),
  clientId: "",
  username: "",
  password: "",
  sslCert: "",
});

const METHOD_META: Record<AuthMethod, { icon: any; labelKey: string; descKey: string }> = {
  accessToken: { icon: KeyRound, labelKey: "authAccessToken", descKey: "authAccessTokenDesc" },
  basic: { icon: Lock, labelKey: "authBasic", descKey: "authBasicDesc" },
  ssl: { icon: ShieldCheck, labelKey: "authSslTls", descKey: "authSslTlsDesc" },
};

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <Label className="text-sm font-medium text-foreground inline-flex items-center gap-1.5 mb-1.5">{children}</Label>
);

interface Props {
  value: SecurityValue;
  onChange?: (v: SecurityValue) => void;
  readOnly?: boolean;
}

export const SecurityConfig = ({ value, onChange, readOnly = false }: Props) => {
  const { t } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const patch = (p: Partial<SecurityValue>) => onChange?.({ ...value, ...p });

  const onCertFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patch({ sslCert: String(reader.result || "") });
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* Method selector — all three shown; only the selected one is active. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {AUTH_METHODS.map((m) => {
          const meta = METHOD_META[m];
          const Icon = meta.icon;
          const active = value.method === m;
          return (
            <button
              key={m}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && patch({ method: m })}
              className={`flex items-start gap-2.5 p-3 rounded-lg border-2 text-start transition-colors disabled:cursor-default ${
                active
                  ? "border-primary bg-primary/5"
                  : `border-border ${readOnly ? "opacity-50" : "hover:border-primary/40"}`
              }`}
            >
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
              <span className="min-w-0">
                <span className={`block text-sm font-medium ${active ? "text-primary" : "text-foreground"}`}>{t(meta.labelKey as any)}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">{t(meta.descKey as any)}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Config for the active method only */}
      <div className="rounded-lg border border-border p-4 bg-muted/30">
        {value.method === "accessToken" && (
          <div>
            <FieldLabel>{t("authAccessToken")}</FieldLabel>
            <div className="flex gap-2">
              <Input value={value.accessToken} readOnly className="h-11 font-mono text-xs" dir="ltr" />
              {!readOnly && (
                <Button type="button" variant="outline" className="h-11 shrink-0" onClick={() => patch({ accessToken: generateAccessToken() })}>
                  <RefreshCw className="h-4 w-4 me-2" /> {t("regenerate")}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{t("authAccessTokenHint")}</p>
          </div>
        )}

        {value.method === "basic" && (
          <div className="space-y-4">
            <div>
              <FieldLabel>{t("clientId")}</FieldLabel>
              <div className="flex gap-2">
                <Input
                  value={value.clientId}
                  onChange={(e) => patch({ clientId: e.target.value })}
                  placeholder={t("enterClientId")}
                  className="h-11 font-mono text-xs"
                  disabled={readOnly}
                  dir="ltr"
                />
                {!readOnly && (
                  <Button type="button" variant="outline" className="h-11 shrink-0" onClick={() => patch({ clientId: generateAccessToken() })}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel>{t("username")}</FieldLabel>
              <Input
                value={value.username}
                onChange={(e) => patch({ username: e.target.value })}
                placeholder={t("enterUsername")}
                className="h-11"
                disabled={readOnly}
                dir="ltr"
              />
            </div>
            <div>
              <FieldLabel>{t("password")}</FieldLabel>
              <Input
                type="password"
                value={value.password}
                onChange={(e) => patch({ password: e.target.value })}
                placeholder={readOnly ? "••••••••" : t("enterPassword")}
                className="h-11"
                disabled={readOnly}
                dir="ltr"
              />
            </div>
            </div>
          </div>
        )}

        {value.method === "ssl" && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <FieldLabel>{t("certificatePem")}</FieldLabel>
              {!readOnly && (
                <>
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <Upload className="h-4 w-4 me-2" /> {t("uploadCertificate")}
                  </Button>
                  <input ref={fileRef} type="file" accept=".pem,.crt,.cer,.key,.txt" className="hidden" onChange={onCertFile} />
                </>
              )}
            </div>
            <Textarea
              value={value.sslCert}
              onChange={(e) => patch({ sslCert: e.target.value })}
              placeholder={"-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"}
              className="font-mono text-xs min-h-[140px]"
              dir="ltr"
              disabled={readOnly}
            />
            <p className="text-xs text-muted-foreground mt-1.5">{t("certificatePemHint")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityConfig;
