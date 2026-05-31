"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {/* App is locked to its light design; forcedTheme keeps every surface consistent. */}
      <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
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
