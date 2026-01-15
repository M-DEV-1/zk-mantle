import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata = {
  title: "ZK GPS",
  description: "Zero-Knowledge Identity Verification on Mantle Network",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
