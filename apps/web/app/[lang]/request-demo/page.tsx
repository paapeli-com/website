"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/contexts/LanguageContext";
import { contactHref } from "@/lib/contact-link";

/* Demos, sales and support all end up on the same form now. This route
   stays so older links and bookmarks still land somewhere sensible. */
export default function RequestDemoPage() {
  const router = useRouter();
  const { language } = useLanguage();

  useEffect(() => {
    router.replace(contactHref(language));
  }, [router, language]);

  return null;
}
