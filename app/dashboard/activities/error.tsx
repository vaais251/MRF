"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="p-8 w-full h-[60vh] flex flex-col items-center justify-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-amber-600" />
      </div>
      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Something went wrong</h2>
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-mono text-slate-600 dark:text-slate-300 overflow-auto text-left">
          {error.message || "An unexpected error occurred"}
        </div>
      </div>
      <div className="flex gap-4">
        <Button onClick={() => reset()} className="bg-mrt-navy hover:bg-mrt-navy/90 text-white">Try again</Button>
      </div>
    </div>
  )
}
