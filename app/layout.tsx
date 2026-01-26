


import "./globals.css";
import { Manrope } from "next/font/google";
import ClientLayout from "./client-layout";

const manrope = Manrope({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
