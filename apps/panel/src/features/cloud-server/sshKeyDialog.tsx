import { useEffect, useState } from "react";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Textarea } from "@/features/factory/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/factory/components/ui/dialog";
import { FieldLabel } from "@/features/factory/components/FieldLabel";
import { cn } from "@/shared/lib/utils";
import { useT } from "./i18n";
import { addSshKey, sshKeyNameTaken, type SshKeyRecord } from "./lib/sshKeyStore";
import { parsePublicKey } from "./lib/sshKeyGen";
import { apiCall } from "./lib/openstackErrors";

/* Add an SSH key in place: a name and a pasted public key, into the
 * account's keys so the SSH Keys page lists it too. Opened from the server
 * wizard and from an Auto Scale group's template.
 */

export function AddKeyDialog({
  open,
  onOpenChange,
  onAdd,
  region,
  zone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (key: SshKeyRecord) => void;
  region: string;
  zone: string;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [tried, setTried] = useState(false);
  const [parsed, setParsed] = useState<Awaited<ReturnType<typeof parsePublicKey>>>("empty");
  useEffect(() => {
    let live = true;
    void parsePublicKey(key).then((r) => live && setParsed(r));
    return () => {
      live = false;
    };
  }, [key]);
  const keyOk = typeof parsed !== "string";
  const nameTaken = sshKeyNameTaken(name);
  const ok = !!name.trim() && !nameTaken && keyOk;

  useEffect(() => {
    if (open) {
      setName("");
      setKey("");
      setTried(false);
    }
  }, [open]);

  const submit = async () => {
    setTried(true);
    if (!ok) return;
    if (typeof parsed === "string") return;
    /* Into the account's keys, so the SSH Keys page lists it too. */
    const added = await apiCall(
      () =>
        addSshKey({
        name: name.trim(),
        type: "ssh",
        algorithm: parsed.algorithm,
        bits: parsed.bits,
        publicKey: parsed.publicKey,
        fingerprint: parsed.fingerprint,
        origin: "imported",
        region,
        zone,
        allZones: true,
      }),
      t,
    );
    if (!added) return;
    onAdd(added);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-uniform-type className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("Add SSH key")}</DialogTitle>
          <DialogDescription>{t("Paste a public key, for example the contents of ~/.ssh/id_ed25519.pub.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <FieldLabel required htmlFor="key-name">
              {t("Key name")}
            </FieldLabel>
            <Input id="key-name" dir="ltr" value={name} onChange={(e) => setName(e.target.value)} className={cn(nameTaken && "border-destructive")} />
            {nameTaken && <p className="mt-1.5 text-xs text-destructive">{t("A key with this name already exists.")}</p>}
          </div>
          <div>
            <FieldLabel required htmlFor="key-body">
              {t("Public key")}
            </FieldLabel>
            <Textarea
              id="key-body"
              dir="ltr"
              rows={4}
              spellCheck={false}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="ssh-ed25519 AAAA…"
              className={cn("font-mono text-xs", tried && !keyOk && "border-destructive")}
            />
            {tried && !keyOk && <p className="mt-1.5 text-xs text-destructive">{t("This does not look like a public key.")}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </Button>
          <Button onClick={submit}>{t("Add")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
