import "./globals.css";
import { cookies } from "next/headers";
import { APP_NAME, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME, isSupportedLanguage } from "@/config/env";
import { getDirection } from "@/lib/i18n/direction";
import { AppProviders } from "@/providers/app-providers";

export const metadata = {
  title: APP_NAME,
  description: "AD Auto Parts frontend foundation for customer and admin experiences.",
  icons: {
    icon: "/ad-auto-parts-logo.png",
    shortcut: "/ad-auto-parts-logo.png",
    apple: "/ad-auto-parts-logo.png",
  },
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const cookieLanguage = cookieStore.get(LANGUAGE_COOKIE_NAME)?.value;
  const initialLanguage = isSupportedLanguage(cookieLanguage) ? cookieLanguage : DEFAULT_LANGUAGE;

  return (
    <html lang={initialLanguage} dir={getDirection(initialLanguage)} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
