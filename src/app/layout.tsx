import {Inter} from 'next/font/google'
import './globals.css'
import {BarChart3, Calculator, Import, List} from 'lucide-react'

import NavbarLink from '../../../src/components/custom/NavbarLink'
import {ReactNode} from 'react'

const inter = Inter({subsets: ['latin']})

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang='en'>
    <body className={inter.className}>
    <div className='flex min-h-screen w-full flex-col bg-muted/40'>
      <aside className='fixed inset-y-0 left-0 z-10 w-14 flex-col border-r bg-background flex'>
        <nav className='flex flex-col items-center gap-4 px-2 sm:py-5'>
          <NavbarLink link='Dashboard' href='#' icon={<BarChart3 className='h-5 w-5'/>}/>
          <NavbarLink link='Expenses' href='/transactions' icon={<List className='h-5 w-5'/>}/>
          <NavbarLink link='Import' href='/import' icon={<Import className='h-5 w-5'/>}/>
          <NavbarLink link='Budget' href='/budget' icon={<Calculator className='h-5 w-5'/>}/>
        </nav>
      </aside>
      {children}
    </div>
    </body>
    </html>
  )
}
