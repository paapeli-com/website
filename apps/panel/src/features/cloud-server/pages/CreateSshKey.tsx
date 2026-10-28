import { useEffect, useRef, useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Download, FileKey2, FileUp, KeyRound, Loader2, MapPin, Tag, Upload } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Card } from "@/features/factory/components/ui/card";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Input } from "@/features/factory/components/ui/input";
import { Textarea } from "@/features/factory/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/features/factory/components/ui/dialog";
import { useShellT } from "@/shared/i18n/shell";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { REGIONS } from "../lib/catalog";
import { addSshKey, sshKeyNameTaken } from "../lib/sshKeyStore";
import { apiCall } from "../lib/openstackErrors";
import {
  algorithmLabel,
  canMakeEd25519,
  downloadText,
  generateKeyPair,
  parseCertificate,
  parsePublicKey,
  type GeneratedKey,
  type KeyFileFormat,
  type ParsedKey,
  type ParseProblem,
} from "../lib/sshKeyGen";
import { CreateFooter, CreatePage, PageBreadcrumb, SSH_KEYS_PATH } from "../ui";
import { FieldBox, Note, OptionCard, StepSection, SummaryLine } from "../wizard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";

/* Add SSH key: one page, no steps.
 *
 *   The row     its name, and the zones it is added to (all by default).
 *   How         a key you already have, pasted or dropped in (or, for
 *               Windows, an X.509 certificate), or a new pair made here.
 *
 * A new pair is made in the browser (see lib/sshKeyGen.ts). Its private key
 * is downloaded at once and offered again in a dialog that is closed only
 * once its owner confirms it is saved: it is not kept anywhere else.
 */

const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,62}$/;

type Method = "import" | "generate";

const PROBLEM_TEXT: Record<Exclude<ParseProblem, "empty">, string> = {
  format: "This does not look like a public key. Paste the contents of the .pub file, starting with ssh-ed25519, ssh-rsa or ecdsa-sha2.",
  dsa: "DSA keys are no longer accepted by current SSH servers. Use an Ed25519 or RSA key.",
  certificate: "This does not look like a certificate. Paste a PEM certificate, from -----BEGIN CERTIFICATE----- to -----END CERTIFICATE-----.",
};

export default function CreateSshKey() {
  const t = useT();
  const shellT = useShellT();
  const navigate = useNavigate();
  const goToList = () => navigate(SSH_KEYS_PATH);

  const [zone, setZone] = useState(REGIONS[0].zones[0]);
  const region = REGIONS.find((r) => r.zones.includes(zone)) ?? REGIONS[0];
  const [name, setName] = useState("");
  const [method, setMethod] = useState<Method>("import");
  const [allZones, setAllZones] = useState(true);
  const [showErrors, setShowErrors] = useState(false);

  /* Bringing one's own. */
  const [keyType, setKeyType] = useState<"ssh" | "x509">("ssh");
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedKey | ParseProblem>("empty");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  /* Making a new pair. */
  const [algorithm, setAlgorithm] = useState<"ed25519" | "rsa">("ed25519");
  const [ed25519Ok, setEd25519Ok] = useState(true);
  const [format, setFormat] = useState<KeyFileFormat>("openssh");
  const [busy, setBusy] = useState(false);
  const [made, setMade] = useState<GeneratedKey | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void canMakeEd25519().then((ok) => {
      setEd25519Ok(ok);
      if (!ok) setAlgorithm("rsa");
    });
  }, []);

  /* Read as it is typed: the type and the fingerprint show before saving. */
  useEffect(() => {
    let live = true;
    void (keyType === "ssh" ? parsePublicKey(text) : parseCertificate(text)).then((r) => live && setParsed(r));
    return () => {
      live = false;
    };
  }, [text, keyType]);

  /* A key pasted with its comment names itself, until a name is typed. */
  const [nameTouched, setNameTouched] = useState(false);
  useEffect(() => {
    if (nameTouched || typeof parsed === "string" || keyType !== "ssh") return;
    const comment = parsed.publicKey.split(/\s+/)[2]?.replace(/@.*$/, "").replace(/[^A-Za-z0-9._-]/g, "-");
    if (comment && NAME_RE.test(comment)) setName(comment);
  }, [parsed, nameTouched, keyType]);

  const nameTaken = sshKeyNameTaken(name);
  const nameOk = NAME_RE.test(name) && !nameTaken;
  const keyOk = method === "generate" || typeof parsed !== "string";
  const problem = typeof parsed === "string" && parsed !== "empty" ? PROBLEM_TEXT[parsed] : null;

  const readFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 64 * 1024) {
      toast.error(t("This file is too large to be a public key."));
      return;
    }
    void file.text().then((body) => {
      if (/PRIVATE KEY/.test(body)) {
        toast.error(t("This is a private key. Choose the public one, the file ending in .pub."));
        return;
      }
      setText(body.trim());
      if (/BEGIN CERTIFICATE/.test(body)) setKeyType("x509");
    });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    readFile(e.dataTransfer.files[0]);
  };

  const where = { region: region.city, zone, allZones };

  const create = async () => {
    if (!nameOk || !keyOk) {
      setShowErrors(true);
      toast.error(t("Fix the highlighted field to continue."));
      return;
    }
    if (method === "import" && typeof parsed !== "string") {
      const added = await apiCall(
        () => addSshKey({ name, type: keyType, algorithm: parsed.algorithm, bits: parsed.bits, publicKey: parsed.publicKey, fingerprint: parsed.fingerprint, origin: "imported", ...where }),
        t,
      );
      if (!added) return;
      toast.success(t("{name} added", { name }));
      goToList();
      return;
    }
    setBusy(true);
    let pair: GeneratedKey;
    try {
      pair = await generateKeyPair(algorithm, name);
    } catch {
      toast.error(t("This browser could not make the key. Try RSA, or another browser."));
      setBusy(false);
      return;
    }
    /* The key is saved first: a refused one is never handed out. */
    const added = await apiCall(
      () => addSshKey({ name, type: "ssh", algorithm: pair.algorithm, bits: pair.bits, publicKey: pair.publicKey, fingerprint: pair.fingerprint, origin: "generated", ...where }),
      t,
    );
    setBusy(false);
    if (!added) return;
    /* Straight to the downloads folder; the dialog offers it again. */
    downloadText(`${name}.${format === "ppk" ? "ppk" : "pem"}`, pair.files[format]);
    setSaved(false);
    setMade(pair);
  };

  const primaryLabel = method === "generate" ? t("Make key pair") : t("Add SSH key");
  const typeLabel =
    method === "generate"
      ? algorithmLabel(algorithm, algorithm === "rsa" ? 4096 : undefined)
      : typeof parsed !== "string"
        ? algorithmLabel(parsed.algorithm, parsed.bits)
        : "-";

  return (
    <CreatePage>
      <PageBreadcrumb
        items={[
          { label: shellT("Security"), path: SSH_KEYS_PATH },
          { label: shellT("SSH Keys"), path: SSH_KEYS_PATH },
          { label: t("Add SSH key") },
        ]}
      />
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">{t("Add SSH key")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("Log in to your servers with a key instead of a password.")}</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0 space-y-6 p-4 lg:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FieldBox pinTop title={t("Key name")} required description={t("Letters, digits, dots, hyphens and underscores; up to 63 characters.")}>
              <Input
                dir="ltr"
                value={name}
                onChange={(e) => {
                  setNameTouched(true);
                  setName(e.target.value.replace(/\s/g, "-"));
                }}
                placeholder="my-laptop"
                aria-label={t("Key name")}
                aria-invalid={showErrors && !nameOk}
                className={cn("h-12", (showErrors || nameTaken) && !nameOk && "border-destructive")}
              />
              {(showErrors || nameTaken) && !nameOk && (
                <p className="mt-1.5 text-xs text-destructive">
                  {nameTaken ? t("A key with this name already exists.") : t("Use letters, digits, dots, hyphens or underscores, starting with a letter or digit.")}
                </p>
              )}
            </FieldBox>
            <FieldBox title={t("Availability zones")} description={t("Which servers can be given this key when they are made.")}>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:border-primary/30">
                <Checkbox checked={allZones} onCheckedChange={(c) => setAllZones(c === true)} className="mt-0.5" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">{t("Add it to every availability zone")}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {allZones ? t("Servers in any region and zone can use this key.") : t("Only servers made in the zone below can use this key.")}
                  </span>
                </span>
              </label>
              {!allZones && (
                <Select dir="ltr" value={zone} onValueChange={setZone}>
                  <SelectTrigger className="mt-2 h-10" aria-label={t("Availability zone")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.flatMap((r) =>
                      r.zones.map((z) => (
                        <SelectItem key={`${r.id}-${z}`} value={z}>
                          {z} · {t(r.city)}
                        </SelectItem>
                      )),
                    )}
                  </SelectContent>
                </Select>
              )}
            </FieldBox>
          </div>

          <div className="border-t border-border pt-5">
            <StepSection icon={KeyRound} title={t("Key")} description={t("Bring the public key of a pair you have, or make a new pair.")}>
              <div role="radiogroup" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <OptionCard selected={method === "import"} onSelect={() => setMethod("import")}>
                  <div className="flex items-center gap-2.5">
                    <Upload className={cn("size-4", method === "import" ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-sm font-semibold text-foreground">{t("Use a key I have")}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t("Paste or drop in its public key. The private key stays on your computer.")}</p>
                </OptionCard>
                <OptionCard selected={method === "generate"} onSelect={() => setMethod("generate")}>
                  <div className="flex items-center gap-2.5">
                    <KeyRound className={cn("size-4", method === "generate" ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-sm font-semibold text-foreground">{t("Make a new key pair")}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t("Made in your browser. You download the private key once.")}</p>
                </OptionCard>
              </div>

              {method === "import" ? (
                <div className="mt-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div role="radiogroup" aria-label={t("Key type")} className="inline-flex rounded-lg border border-border p-0.5">
                      {(
                        [
                          ["ssh", t("SSH public key")],
                          ["x509", t("X.509 certificate (Windows)")],
                        ] as const
                      ).map(([v, label]) => (
                        <button
                          key={v}
                          type="button"
                          role="radio"
                          aria-checked={keyType === v}
                          onClick={() => setKeyType(v)}
                          className={cn(
                            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                            keyType === v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileInput.current?.click()}>
                      <FileUp className="size-4" />
                      {t("Choose file")}
                    </Button>
                    <input
                      ref={fileInput}
                      type="file"
                      accept=".pub,.crt,.cer,.pem,text/plain"
                      className="hidden"
                      onChange={(e) => {
                        readFile(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className={cn("rounded-lg transition-shadow", dragging && "ring-2 ring-primary/40")}
                  >
                    <Textarea
                      dir="ltr"
                      rows={5}
                      spellCheck={false}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={keyType === "ssh" ? "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA… you@laptop" : "-----BEGIN CERTIFICATE-----\n…\n-----END CERTIFICATE-----"}
                      aria-label={keyType === "ssh" ? t("Public key") : t("Certificate")}
                      aria-invalid={(showErrors || !!problem) && !keyOk}
                      className={cn("resize-y font-mono text-xs leading-5", (showErrors || problem) && !keyOk && "border-destructive")}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{t("Paste it here, or drop the file onto the box.")}</p>

                  {typeof parsed !== "string" ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] px-3 py-2 text-xs">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      <span className="font-medium text-foreground" dir="ltr">
                        {algorithmLabel(parsed.algorithm, parsed.bits)}
                      </span>
                      <code dir="ltr" className="min-w-0 break-all font-mono text-muted-foreground">
                        {parsed.fingerprint}
                      </code>
                    </div>
                  ) : problem ? (
                    <p className="text-xs text-destructive">{t(problem)}</p>
                  ) : (
                    showErrors && <p className="text-xs text-destructive">{keyType === "ssh" ? t("Paste a public key.") : t("Paste a certificate.")}</p>
                  )}

                  <Note>
                    {keyType === "ssh" ? (
                      <>
                        {t("On your computer, the public key is in")} <code dir="ltr">~/.ssh/id_ed25519.pub</code> {t("or")}{" "}
                        <code dir="ltr">~/.ssh/id_rsa.pub</code>. {t("No key yet? Make one with")} <code dir="ltr">ssh-keygen -t ed25519</code>{" "}
                        {t("or choose Make a new key pair above.")}
                      </>
                    ) : (
                      t("A certificate is used to log in to Windows servers, not by SSH. Servers made from Linux images use SSH keys.")
                    )}
                  </Note>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">{t("Algorithm")}</p>
                      <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as "ed25519" | "rsa")}>
                        <SelectTrigger className="h-10" aria-label={t("Algorithm")}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ed25519" disabled={!ed25519Ok}>
                            Ed25519 · {t("Recommended")}
                          </SelectItem>
                          <SelectItem value="rsa">RSA 4096</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {algorithm === "rsa"
                          ? t("For older systems and tools that do not read Ed25519.")
                          : t("Short, fast and secure. Accepted by every current system.")}
                        {!ed25519Ok && ` ${t("This browser cannot make Ed25519 keys.")}`}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">{t("Private key file")}</p>
                      <Select value={format} onValueChange={(v) => setFormat(v as KeyFileFormat)}>
                        <SelectTrigger className="h-10" aria-label={t("Private key file")}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openssh">OpenSSH (.pem)</SelectItem>
                          <SelectItem value="ppk">PuTTY (.ppk)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {format === "ppk" ? t("For PuTTY and WinSCP on Windows.") : t("For ssh on Linux, macOS and Windows 10 and later.")}
                      </p>
                    </div>
                  </div>

                  <Note>
                    {t("The pair is made in your browser and only the public key is saved. The private key is downloaded once and kept nowhere else: keep it somewhere safe.")}
                  </Note>
                </div>
              )}
            </StepSection>
          </div>

        </Card>

        <aside className="xl:sticky xl:top-4">
          <Card className="p-5">
            <p className="mb-2 text-sm font-semibold text-foreground">{t("Summary")}</p>
            <SummaryLine icon={Tag} label={t("Key name")} value={<span dir="ltr">{name || "-"}</span>} />
            <SummaryLine icon={method === "generate" ? KeyRound : Upload} label={t("Key")} value={method === "generate" ? t("New pair") : t("Your own")} />
            <SummaryLine icon={keyType === "x509" && method === "import" ? FileKey2 : KeyRound} label={t("Key type")} value={<span dir="ltr">{typeLabel}</span>} />
            {method === "generate" && (
              <SummaryLine icon={Download} label={t("Private key file")} value={format === "ppk" ? "PuTTY (.ppk)" : "OpenSSH (.pem)"} />
            )}
            <SummaryLine icon={MapPin} label={t("Availability zones")} value={allZones ? t("All zones") : <span dir="ltr">{zone}</span>} />
            <Button onClick={() => void create()} disabled={busy} className="mt-4 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              {busy ? t("Making the key…") : primaryLabel}
            </Button>
          </Card>
        </aside>
      </div>

      <CreateFooter cancel={{ label: t("Cancel"), onClick: goToList }} primary={{ label: primaryLabel, onClick: () => void create() }} />

      {/* The one chance at the private key: closed only once it is saved. */}
      <Dialog open={!!made} onOpenChange={() => undefined}>
        <DialogContent data-uniform-type className="sm:max-w-lg [&>button:last-child]:hidden" onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t("Save your private key")}</DialogTitle>
            <DialogDescription>
              {t("{name} is added and its private key has been downloaded. It is not kept anywhere else and cannot be downloaded again after you close this.", { name })}
            </DialogDescription>
          </DialogHeader>
          {made && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
                <span className="text-muted-foreground">{t("Fingerprint")}: </span>
                <code dir="ltr" className="break-all font-mono text-foreground">
                  {made.fingerprint}
                </code>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button variant={format === "openssh" ? "default" : "outline"} className="gap-2" onClick={() => downloadText(`${name}.pem`, made.files.openssh)}>
                  <Download className="size-4" />
                  OpenSSH (.pem)
                </Button>
                <Button variant={format === "ppk" ? "default" : "outline"} className="gap-2" onClick={() => downloadText(`${name}.ppk`, made.files.ppk)}>
                  <Download className="size-4" />
                  PuTTY (.ppk)
                </Button>
              </div>
              <Note>
                {t("On Linux and macOS, ssh accepts the file only when it is yours alone:")} <code dir="ltr">chmod 600 {name}.pem</code>
              </Note>
              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-foreground">
                <Checkbox checked={saved} onCheckedChange={(c) => setSaved(c === true)} className="mt-0.5" />
                {t("I confirm that I have saved the private key somewhere safe.")}
              </label>
            </div>
          )}
          <DialogFooter>
            <Button disabled={!saved} onClick={goToList}>
              {t("Done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CreatePage>
  );
}
