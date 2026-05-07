"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <ProgressBar
          height="3px"
          color="#C9A84C"
          options={{ showSpinner: false }}
          shallowRouting
        />
      </ThemeProvider>
    </SessionProvider>
  )
}
