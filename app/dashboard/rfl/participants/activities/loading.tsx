import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="p-8 w-full h-[60vh] flex flex-col items-center justify-center space-y-4 text-slate-500 dark:text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-mrt-gold" />
      <p className="font-medium animate-pulse">Loading activities…</p>
    </div>
  )
}
