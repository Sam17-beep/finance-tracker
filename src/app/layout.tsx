import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import {BarChart3, Calculator, Import, List} from 'lucide-react'
import NavbarLink from "@/components/custom/NavbarLink";
import {Toaster} from "@/components/ui/toaster";

import { TRPCReactProvider } from "@/trpc/react";

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
    <html lang="en" className={`${geist.variable}`}>
     <body >
    <TRPCReactProvider>
      <div className='flex min-h-screen w-full flex-col bg-muted/40 pl-14'>
        <aside className='fixed inset-y-0 left-0 z-10 w-14 flex-col border-r bg-background flex'>
          <nav className='flex flex-col items-center gap-4 px-2 sm:py-5'>
            <NavbarLink link='Dashboard' href='/' icon={<BarChart3 className='h-5 w-5'/>}/>
            <NavbarLink link='Expenses' href='/transactions' icon={<List className='h-5 w-5'/>}/>
            <NavbarLink link='Import' href='/import' icon={<Import className='h-5 w-5'/>}/>
            <NavbarLink link='Budget' href='/budget' icon={<Calculator className='h-5 w-5'/>}/>
          </nav>
        </aside>
        {children}
        <Toaster/>
      </div>
    </TRPCReactProvider>
    </body>
    </html>
  );
}
