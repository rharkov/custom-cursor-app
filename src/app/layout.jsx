import { Poppins, Playfair_Display } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-poppins",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair",
});

export const metadata = {
  title: "Cosmetics Brand Expo",
  description: "Discover our exquisite brands.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${poppins.variable} ${playfair.variable} min-h-dvh w-full bg-[#f5f5dc] text-[#3d3d3d] antialiased`}
      >
        <main className="min-h-dvh w-full">{children}</main>
      </body>
    </html>
  );
}
