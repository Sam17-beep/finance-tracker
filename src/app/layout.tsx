import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { BarChart3, Calculator, Import, List } from "lucide-react";
import NavbarLink from "@/components/custom/NavbarLink";
import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeToggleButton } from "@/components/custom/ThemeToggleButton";
import { DateProvider } from "@/components/contexts/DateContext";

export const metadata: Metadata = {
  title: "Finance App",
  description: "Finance App",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider>
            <DateProvider>
              <div className="bg-muted/40 dark:bg-muted/80 flex min-h-screen w-full flex-col pl-14">
                <aside className="bg-background fixed inset-y-0 left-0 z-10 flex w-14 flex-col border-r">
                  <nav className="flex flex-grow flex-col items-center justify-between px-2 sm:py-5">
                    <div className="flex flex-col items-center gap-4">
                      <NavbarLink
                        link="Dashboard"
                        href="/"
                        icon={<BarChart3 className="h-5 w-5" />}
                      />
                      <NavbarLink
                        link="Expenses"
                        href="/transactions"
                        icon={<List className="h-5 w-5" />}
                      />
                      <NavbarLink
                        link="Import"
                        href="/import"
                        icon={<Import className="h-5 w-5" />}
                      />
                      <NavbarLink
                        link="Budget"
                        href="/budget"
                        icon={<Calculator className="h-5 w-5" />}
                      />
                    </div>
                    <div className="pb-4">
                      <ThemeToggleButton />
                    </div>
                  </nav>
                </aside>
                <main className="main-page">{children}</main>
                <Toaster />
              </div>
            </DateProvider>
          </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
