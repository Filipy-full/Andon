import type { Metadata } from "next";
import "./globals.css";
import "../index.css";

export const metadata: Metadata = {
  title: "Andon Pro",
  description: "Sistema industrial de alertas y operaciones",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="es"><body>{children}</body></html>;
}
