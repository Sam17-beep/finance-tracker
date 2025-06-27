import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import {BarChart3, Calculator, Import, List, Building2} from 'lucide-react'
import NavbarLink from "@/components/custom/NavbarLink";
import {Toaster} from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TimeframeProvider } from "@/components/providers/timeframe-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";

import { TRPCReactProvider } from "@/trpc/react";
import {HydrateClient} from '@/trpc/server'

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
     <body suppressHydrationWarning>
    <TRPCReactProvider>
      <HydrateClient>
        <ThemeProvider>
          <TimeframeProvider>
            <div className='flex min-h-screen w-full flex-col bg-muted/40 pl-14'>
              <aside className='fixed inset-y-0 left-0 z-10 w-14 flex-col border-r bg-background flex'>
                <nav className='flex flex-col items-center gap-4 px-2 sm:py-5'>
                  <NavbarLink link='Dashboard' href='/' icon={<BarChart3 className='h-5 w-5'/>}/>
                  <NavbarLink link='Transactions' href='/transactions' icon={<List className='h-5 w-5'/>}/>
                  <NavbarLink link='Budget' href='/budget' icon={<Calculator className='h-5 w-5'/>}/>
                  <NavbarLink link='Import' href='/import' icon={<Import className='h-5 w-5'/>}/>
                  <NavbarLink link='Banks' href='/banks' icon={<Building2 className='h-5 w-5'/>}/>
                  <div className="mt-auto">
                    <ThemeToggle />
                  </div>
                </nav>
              </aside>
              {children}
              <Toaster/>
            </div>
          </TimeframeProvider>
        </ThemeProvider>
      </HydrateClient>
    </TRPCReactProvider>
    </body>
    </html>
  );
}
