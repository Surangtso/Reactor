import type { Metadata, Viewport } from "next";
import { Roboto, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "./sw-register";
import { LocaleProvider } from "./locale-provider";
import { getMessages } from "@/lib/i18n";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getMessages();
  return {
    title: "Reactor",
    description: m.meta.description,
    // 아이폰에서 홈 화면에 추가했을 때 앱처럼 열리게
    appleWebApp: {
      capable: true,
      title: "Reactor",
      statusBarStyle: "default",
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

const HTML_LANG = { ko: "ko", en: "en", zh: "zh-Hans" } as const;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale } = await getMessages();
  return (
    <html
      lang={HTML_LANG[locale]}
      className={`${roboto.variable} ${notoSansKR.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
