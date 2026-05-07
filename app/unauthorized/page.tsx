import Link from "next/link"
import { Lock } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-playfair font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 mb-8 font-dm-sans">
          You don't have permission to view this page. Please contact your system administrator if you believe this is a mistake.
        </p>
        <Link 
          href="/dashboard"
          className="inline-flex items-center justify-center w-full py-3 rounded-lg bg-[#C9A84C] text-white font-medium hover:bg-[#B8943D] transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
