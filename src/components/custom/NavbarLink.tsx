import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import React from 'react'

export default function NavbarLink({
  icon,
  link,
  href,
}: Readonly<{ icon: React.ReactNode; link: string; href: string }>) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            className='flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8'
          >
            {icon}
            <span className='sr-only'>{link}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side='right'>{link}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}