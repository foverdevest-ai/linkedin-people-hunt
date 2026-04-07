import "./tokens.css";
import "./globals.css";

export const metadata = {
  title: "LinkedIn People Hunt",
  description: "Personeel.com internal LinkedIn outbound hub"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
