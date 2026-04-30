import "../artifacts/letterhead/src/index.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tax Deliver Letterhead Tool",
  description: "Apply Tax Deliver letterheads to computation documents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
