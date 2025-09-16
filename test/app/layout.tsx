import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { ProductProvider } from "@/contexts/ProductContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { CartProvider } from "@/contexts/CartContext";
import Navbar from "@/components/Navbar";
import ErrorBoundary from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My App with Supabase Auth",
  description: "Next.js app with Supabase authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AuthProvider>
            <AdminProvider>
              <ProductProvider>
                <OrderProvider>
                  <CartProvider>
                    <Navbar />
                    {children}
                  </CartProvider>
                </OrderProvider>
              </ProductProvider>
            </AdminProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
