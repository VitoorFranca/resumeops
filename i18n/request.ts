import { getRequestConfig } from 'next-intl/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/client';
import { cache } from 'react';

const SUPPORTED_LOCALES = ['en', 'pt-BR', 'es'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  'pt-BR': 'Brazilian Portuguese',
  es: 'Spanish',
};

function isSupported(lang: string): lang is Locale {
  return SUPPORTED_LOCALES.includes(lang as Locale);
}

async function loadMessages(locale: Locale) {
  switch (locale) {
    case 'pt-BR':
      return (await import('../messages/pt-BR.json')).default;
    case 'es':
      return (await import('../messages/es.json')).default;
    default:
      return (await import('../messages/en.json')).default;
  }
}

export const getUserLocale = cache(async (): Promise<Locale> => {
  try {
    const { userId } = await auth();
    if (!userId) return 'en';

    const profile = await db.profile.findFirst({
      where: { user: { clerkId: userId } },
      select: { language: true },
    });

    const lang = profile?.language ?? 'en';
    return isSupported(lang) ? lang : 'en';
  } catch {
    return 'en';
  }
});

export default getRequestConfig(async () => {
  const locale = await getUserLocale();
  return {
    locale,
    messages: await loadMessages(locale),
  };
});
