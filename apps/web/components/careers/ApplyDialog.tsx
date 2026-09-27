"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { localeDigits, type ApplyTarget, type FormCopy } from "@/lib/careers";
import type { Locale } from "@/lib/seo";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* The application form, as a dialog over the careers page.            */
/*                                                                     */
/* It posts to the same inbox as the contact form                      */
/* (app/[lang]/contact/page.tsx): one place for everything the site    */
/* sends us. The subject and the "Request Type" field say this one is  */
/* a resume, so a careers mail is never mistaken for a sales lead.     */
/*                                                                     */
/* The resume itself travels as multipart so the PDF arrives attached. */
/* If the endpoint refuses the attachment, the application is sent     */
/* again without it rather than dropped, and the applicant is told to  */
/* mail the file. Losing the whole application over one file is the    */
/* worse failure.                                                      */
/* ------------------------------------------------------------------ */

const FORM_ENDPOINT = "https://api.web3forms.com/submit";
const ACCESS_KEY = "131ad66a-900d-4406-ae8b-9d13562a36cc";

/** Web3Forms stops at 5 MB itself, and a resume has no business being bigger. */
const MAX_BYTES = 5 * 1024 * 1024;

const EMPTY = { name: "", phone: "", email: "", link: "", about: "" };

/** Sends one body, and says only whether it landed. */
async function post(body: BodyInit, headers?: HeadersInit): Promise<boolean> {
  try {
    const response = await fetch(FORM_ENDPOINT, { method: "POST", headers, body });
    const result = await response.json().catch(() => ({ success: response.ok }));
    return response.ok && result.success !== false;
  } catch {
    return false;
  }
}

export function ApplyDialog({
  target,
  copy,
  onClose,
}: {
  /** The position being applied for, or null while the dialog is shut. */
  target: ApplyTarget | null;
  copy: FormCopy;
  onClose: () => void;
}) {
  const { isRTL, language } = useLanguage();
  const [form, setForm] = useState(EMPTY);
  const [track, setTrack] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  /* A fresh form for every position, so nothing written for one role is
     sent under another. */
  useEffect(() => {
    if (!target) return;
    setForm(EMPTY);
    setResume(null);
    setTrack(target.tracks?.[0]?.id ?? "");
  }, [target]);

  const dir = isRTL ? "rtl" : "ltr";
  const set = (field: keyof typeof EMPTY) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const take = (file: File | undefined) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isPdf) {
      toast.error(copy.resumeWrongType);
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(copy.resumeTooBig);
      return;
    }
    setResume(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!target) return;
    if (!resume) {
      toast.error(copy.resumeMissing);
      return;
    }

    /* Read the honeypot before the first await, while the form is still
       the event's target. */
    const trapped = Boolean(new FormData(event.currentTarget).get("botcheck"));
    const chosen = target.tracks?.find((one) => one.id === track);
    setSending(true);

    /* Field names are what the email shows, so they read as labels. */
    const fields: Record<string, string> = {
      access_key: ACCESS_KEY,
      from_name: "Paapeli Careers",
      subject: `Resume: ${target.reference}`,
      "Request Type": "Resume (careers page)",
      Position: target.reference,
      "Full Name": form.name,
      Email: form.email,
      Phone: form.phone,
      "LinkedIn or GitHub": form.link,
      Track: chosen ? `${chosen.id} (${chosen.title})` : "",
      "Projects and Experience": form.about,
      Language: language,
      botcheck: trapped ? "true" : "",
    };

    const multipart = new FormData();
    Object.entries(fields).forEach(([key, value]) => multipart.append(key, value));
    multipart.append("Resume", resume, resume.name);

    let outcome: "sent" | "without-file" | "failed" = "failed";
    if (await post(multipart)) {
      outcome = "sent";
    } else if (
      await post(
        JSON.stringify({
          ...fields,
          Resume: `${resume.name} could not be attached. Please ask the applicant for the file.`,
        }),
        { "Content-Type": "application/json", Accept: "application/json" },
      )
    ) {
      outcome = "without-file";
    }
    setSending(false);

    if (outcome === "failed") {
      toast.error(copy.failure);
      return;
    }
    if (outcome === "sent") toast.success(copy.success);
    else toast.warning(copy.partial);
    onClose();
  };

  const field = "h-12 rounded-xl border-white/10 bg-[#0b1322] text-white placeholder:text-white/30 focus-visible:ring-primary/40 focus-visible:ring-offset-0";
  /* A number, an address and a link all read left to right whatever the
     page does, but they still sit on the side the reader starts from. */
  const ltrField = cn(field, "rtl:text-right");
  const labelClass = "text-sm font-normal text-white/70";

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent
        dir={dir}
        className="max-h-[92vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border-white/10 bg-[#0d1524] p-6 text-white sm:rounded-2xl md:p-8 [&>button]:hidden"
      >
        {target ? (
          <div className="space-y-6">
            {/* ----------------------------- Heading ---------------------------- */}
            <div className="space-y-2 pe-8">
              <span className="flex items-center gap-2 text-sm font-medium text-primary">
                <span aria-hidden className="size-1.5 rounded-full bg-primary" />
                {copy.eyebrow}
              </span>
              <DialogTitle className="text-2xl font-bold text-white">{copy.title}</DialogTitle>
              <DialogDescription className="text-sm text-white/50">
                {copy.selected}{" "}
                <span className="font-medium text-primary">{target.shortTitle}</span>
              </DialogDescription>
            </div>

            {/* ------------------------------ Fields ---------------------------- */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="a-name" className={labelClass}>
                    {copy.name}
                  </Label>
                  <Input
                    id="a-name"
                    value={form.name}
                    onChange={set("name")}
                    placeholder={copy.namePlaceholder}
                    className={field}
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="a-phone" className={labelClass}>
                    {copy.phone}
                  </Label>
                  <Input
                    id="a-phone"
                    type="tel"
                    dir="ltr"
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder={copy.phonePlaceholder}
                    className={ltrField}
                    maxLength={30}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="a-email" className={labelClass}>
                    {copy.email}
                  </Label>
                  <Input
                    id="a-email"
                    type="email"
                    dir="ltr"
                    value={form.email}
                    onChange={set("email")}
                    placeholder={copy.emailPlaceholder}
                    className={ltrField}
                    maxLength={255}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="a-link" className={labelClass}>
                    {copy.link}
                  </Label>
                  <Input
                    id="a-link"
                    dir="ltr"
                    value={form.link}
                    onChange={set("link")}
                    placeholder={copy.linkPlaceholder}
                    className={ltrField}
                    maxLength={200}
                  />
                </div>
              </div>

              {/* Only the positions that run in parallel tracks ask for one. */}
              {target.tracks?.length ? (
                <div className="space-y-2">
                  <Label htmlFor="a-track" className={labelClass}>
                    {copy.track}
                  </Label>
                  <Select value={track} onValueChange={setTrack}>
                    <SelectTrigger
                      id="a-track"
                      className={cn(field, "text-start [&>span]:truncate")}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#101828] text-white">
                      {target.tracks.map((one) => (
                        <SelectItem
                          key={one.id}
                          value={one.id}
                          className="focus:bg-white/10 focus:text-white"
                        >
                          {one.option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="a-about" className={labelClass}>
                  {copy.about}
                </Label>
                <Textarea
                  id="a-about"
                  value={form.about}
                  onChange={set("about")}
                  placeholder={copy.aboutPlaceholder}
                  className="min-h-[120px] rounded-xl border-white/10 bg-[#0b1322] text-white placeholder:text-white/30 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                  maxLength={2000}
                  rows={4}
                  required
                />
              </div>

              {/* ------------------------- Resume ------------------------- */}
              <div className="space-y-2">
                <span className={labelClass}>{copy.resume}</span>
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    take(event.dataTransfer.files?.[0]);
                  }}
                  className={cn(
                    "rounded-xl border border-dashed transition-colors",
                    dragging ? "border-primary bg-primary/5" : "border-white/15",
                  )}
                >
                  <input
                    ref={fileInput}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(event) => {
                      take(event.target.files?.[0]);
                      /* So picking the same file twice still fires a change. */
                      event.target.value = "";
                    }}
                  />

                  {resume ? (
                    <div className="flex items-center gap-3 p-4">
                      <FileText className="size-5 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white">{resume.name}</p>
                        <p className="text-xs text-white/40">
                          {localeDigits(
                            (resume.size / 1024 / 1024).toFixed(1),
                            language as Locale,
                          )}
                          {" MB"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setResume(null)}
                        aria-label={copy.resumeRemove}
                        className="rounded-md p-1 text-white/40 transition-colors hover:text-white"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      className="flex w-full flex-col items-center gap-1 px-4 py-7 text-center"
                    >
                      <Upload className="mb-1 size-5 text-white/40" />
                      <span className="text-sm text-white/70">{copy.resumeDrop}</span>
                      <span className="text-xs text-white/35">{copy.resumeHint}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Hidden from people, offered to bots. */}
              <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} aria-hidden />

              <button
                type="submit"
                disabled={sending}
                className="flex h-14 w-full items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {sending ? copy.submitting : copy.submit}
              </button>
            </form>

            {/* Last in the markup on purpose: the dialog hands focus to the
                first field rather than to the way out of the form. */}
            <DialogClose
              aria-label={copy.close}
              className="absolute end-5 top-5 rounded-md p-1 text-white/50 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <X className="size-5" />
            </DialogClose>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
