import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3097"),
  ),
  title: {
    default: "IncomeFlow — Give every payment a purpose",
    template: "%s | IncomeFlow",
  },
  description:
    "Configure your spending, savings and reserve wallets once. IncomeFlow automatically allocates supported crypto payments through Reactive Omni. Testnet demonstration.",
  icons: { icon: "/brand/icon.svg", apple: "/brand/app-icon.png" },
  openGraph: {
    title: "IncomeFlow",
    description: "Your income arrives. Your allocations follow.",
    images: ["/brand/social.png"],
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
