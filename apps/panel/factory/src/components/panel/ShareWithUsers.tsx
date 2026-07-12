import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ORG_USERS, userById } from "@/lib/formOptions";
import { UserPlus, Search, X, Users } from "lucide-react";

const fa = (v: string) => (/[؀-ۿ]/.test(v || "") ? "font-vazirmatn" : "");

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

interface Props {
  value: string[];
  onChange?: (ids: string[]) => void;
  readOnly?: boolean;
}

export const ShareWithUsers = ({ value, onChange, readOnly = false }: Props) => {
  const { t, isRTL } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const toggle = (id: string) => {
    if (!onChange) return;
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const filtered = ORG_USERS.filter((u) => {
    const q = query.trim().toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-3">
      {!readOnly && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-11 w-full justify-between font-normal text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                {t("addUsers")}
              </span>
              <span className="text-xs">{value.length > 0 ? `${value.length}` : ""}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0" dir={isRTL ? "rtl" : "ltr"}>
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="h-4 w-4 absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("searchUsers")}
                  className="h-9 ps-8"
                  autoFocus
                />
              </div>
            </div>
            <ScrollArea className="max-h-64">
              <div className="p-1">
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">{t("noUsersFound")}</p>
                ) : filtered.map((u) => {
                  const checked = value.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggle(u.id)}
                      className="w-full flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted text-start"
                    >
                      <Checkbox checked={checked} className="pointer-events-none" />
                      <span className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-semibold inline-flex items-center justify-center shrink-0">
                        {initials(u.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-medium truncate ${fa(u.name)}`}>{u.name}</span>
                        <span className="block text-xs text-muted-foreground truncate" dir="ltr">{u.email}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      )}

      {value.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {t("noUsersShared")}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {value.map((id) => {
            const u = userById(id);
            if (!u) return null;
            return (
              <span key={id} className="inline-flex items-center gap-2 rounded-full bg-muted ps-1 pe-2.5 py-1">
                <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-semibold inline-flex items-center justify-center shrink-0">
                  {initials(u.name)}
                </span>
                <span className={`text-xs font-medium ${fa(u.name)}`}>{u.name}</span>
                {!readOnly && (
                  <button type="button" onClick={() => toggle(id)} className="hover:text-destructive" aria-label={`Remove ${u.name}`}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShareWithUsers;
