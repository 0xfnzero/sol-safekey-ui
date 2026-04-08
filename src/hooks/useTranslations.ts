"use client";

import { useParams } from "next/navigation";
import enMessages from "@/messages/en.json";
import zhMessages from "@/messages/zh.json";

const messagesMap = {
  en: enMessages,
  zh: zhMessages,
};

export function useTranslations() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const messages = messagesMap[locale as keyof typeof messagesMap] || messagesMap.en;

  return function t(key: string): string {
    const keys = key.split(".");
    let value: unknown = messages;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    return typeof value === "string" ? value : key;
  };
}
