import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "../styles.css";
import { AppProvider } from "@/lib/app-context";
import { Sprite } from "@/components/ui";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-plus-jakarta",
});

export const metadata = {
  title: "Beranda | KelasHub",
  description: "KelasHub adalah ruang kerja belajar terpusat untuk sekolah, guru, dan murid.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${dmSans.variable} ${plusJakartaSans.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <Sprite />
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
