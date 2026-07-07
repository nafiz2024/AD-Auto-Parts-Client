import "./globals.css";
import { APP_NAME, DEFAULT_LANGUAGE } from "@/config/env";
import { getDirection } from "@/lib/i18n/direction";
import { AppProviders } from "@/providers/app-providers";

export const metadata = {
  title: APP_NAME,
  description: "AD Auto Parts frontend foundation for customer and admin experiences.",
};

export default function RootLayout({ children }) {
  return (
    <html lang={DEFAULT_LANGUAGE} dir={getDirection(DEFAULT_LANGUAGE)} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
