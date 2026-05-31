"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Book, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  const [error, setError] = useState("")
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [cooldownTime, setCooldownTime] = useState(0)
  const [isShaking, setIsShaking] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  // Generated on the client only (after mount) so server/client HTML match — no hydration mismatch.
  const [particles, setParticles] = useState<{ size: number; left: number; duration: number; delay: number }[]>([])

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, () => ({
        size: Math.random() * 8 + 2,
        left: Math.random() * 100,
        duration: Math.random() * 12 + 8,
        delay: Math.random() * 20,
      }))
    )
  }, [])

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // Cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime(prev => prev - 1)
      }, 1000)
    } else if (cooldownTime === 0 && failedAttempts >= 5) {
      setFailedAttempts(0) // Reset after cooldown
    }
    return () => clearInterval(timer)
  }, [cooldownTime, failedAttempts])

  // Password strength logic
  const getPasswordStrength = () => {
    let score = 0
    if (!password) return { score: 0, text: "", color: "bg-slate-200" }
    if (password.length > 6) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1

    if (score === 0) return { score, text: "Weak", color: "bg-red-400" }
    if (score === 1 || score === 2) return { score, text: "Fair", color: "bg-amber-400" }
    if (score >= 3) return { score, text: "Strong", color: "bg-green-500" }
    return { score: 0, text: "", color: "bg-slate-200" }
  }

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (cooldownTime > 0) return

    setIsLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      const newAttempts = failedAttempts + 1
      setFailedAttempts(newAttempts)
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)

      if (newAttempts >= 5) {
        setCooldownTime(30)
        setError("Too many attempts. Please wait 30 seconds.")
      } else {
        setError("Invalid email or password. Please try again.")
      }
      setIsLoading(false)
    } else {
      router.push("/dashboard") 
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin()
    }
  }

  const strength = getPasswordStrength()

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      {/* Left Panel - 40% Width */}
      <div className="hidden lg:flex lg:w-[40%] bg-mrt-navy relative overflow-hidden flex-col justify-between p-12 animate-in fade-in slide-in-from-left-8 duration-1000">
        
        {/* Animated Particles */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-mrt-gold opacity-20"
              style={{
                width: p.size + "px",
                height: p.size + "px",
                left: p.left + "%",
                top: "100%",
                animation: `floatUp ${p.duration}s linear infinite`,
                animationDelay: `-${p.delay}s`,
              }}
            />
          ))}
          <style jsx>{`
            @keyframes floatUp {
              0% { top: 100%; opacity: 0; transform: translateX(0); }
              10% { opacity: 0.25; }
              90% { opacity: 0.25; }
              100% { top: -10%; opacity: 0; transform: translateX(20px); }
            }
          `}</style>
        </div>

        {/* Animated Golden Waves Background */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden mix-blend-screen">
          <svg className="absolute w-[200%] h-full animate-[spin_60s_linear_infinite] origin-center -left-[50%]" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,50 Q25,25 50,50 T100,50 L100,100 L0,100 Z" fill="none" stroke="#C9A84C" strokeWidth="0.5" className="animate-[pulse_4s_ease-in-out_infinite] drop-shadow-[0_0_8px_rgba(201,168,76,0.8)]"/>
            <path d="M0,60 Q25,35 50,60 T100,60 L100,100 L0,100 Z" fill="none" stroke="#C9A84C" strokeWidth="0.3" className="animate-[pulse_5s_ease-in-out_infinite_reverse] drop-shadow-[0_0_5px_rgba(201,168,76,0.5)]"/>
            <path d="M0,40 Q25,15 50,40 T100,40 L100,100 L0,100 Z" fill="none" stroke="#C9A84C" strokeWidth="0.4" className="animate-[pulse_6s_ease-in-out_infinite] drop-shadow-[0_0_10px_rgba(201,168,76,0.6)]"/>
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-mrt-gold/20 flex items-center justify-center">
              <Book className="text-mrt-gold w-6 h-6" />
            </div>
            <div>
              <h1 className="font-playfair text-xl font-bold text-white leading-tight">Miri Roshni Trust</h1>
              <p className="text-mrt-gold/80 text-xs font-medium uppercase tracking-wider">Monitoring & Evaluation System</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md mt-20 mb-auto">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            Empowering <span className="text-mrt-gold">Education,</span><br/> Transforming Lives
          </h2>
          <p className="text-slate-300 text-lg">
            A comprehensive platform to track, manage, and elevate educational initiatives across all our programs.
          </p>
        </div>

        <div className="relative z-10 flex gap-4">
          {['MRHSS', 'MRA', 'RFL'].map((badge) => (
            <div key={badge} className="px-4 py-2 rounded-full border border-mrt-gold/30 bg-mrt-gold/10 text-mrt-gold text-sm font-semibold backdrop-blur-sm shadow-[0_0_15px_rgba(201,168,76,0.1)]">
              {badge}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - 60% Width */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 md:px-24 lg:px-32 relative animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both dark:bg-slate-900">
        <div className={`w-full max-w-md mx-auto transition-transform ${isShaking ? "animate-shake" : ""}`}>
          
          <div className="mb-10 text-center lg:text-left">
            <h2 className="font-playfair text-3xl font-bold text-slate-900 dark:text-white mb-3">Welcome back</h2>
            <p className="text-slate-500 dark:text-slate-400">Enter your credentials to access your account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-900/50 flex items-start gap-3 animate-in slide-in-from-top-2">
              <div className="flex-1 text-sm font-medium text-red-800 dark:text-red-200">
                {error}
                {cooldownTime > 0 && <span className="block mt-1 text-red-600 font-bold">{cooldownTime}s remaining</span>}
              </div>
              <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} onKeyDown={handleKeyDown} className="space-y-6">
            <div className="space-y-2 relative">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-semibold">Email address</Label>
              <div className="relative">
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@mrt.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-mrt-navy dark:focus-visible:ring-mrt-gold pr-10"
                />
                {isValidEmail && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-in zoom-in" />
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-semibold">Password</Label>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                  className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-mrt-navy dark:focus-visible:ring-mrt-gold pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {passwordFocused && password.length > 0 && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-1">
                  <div className="flex gap-1 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.score >= 0 ? strength.color : 'bg-transparent'} transition-all w-1/4`} />
                    <div className={`h-full ${strength.score >= 1 ? strength.color : 'bg-transparent'} transition-all w-1/4`} />
                    <div className={`h-full ${strength.score >= 2 ? strength.color : 'bg-transparent'} transition-all w-1/4`} />
                    <div className={`h-full ${strength.score >= 3 ? strength.color : 'bg-transparent'} transition-all w-1/4`} />
                  </div>
                  <p className={`text-xs mt-1 text-right font-medium ${
                    strength.score === 0 ? "text-red-500" :
                    strength.score <= 2 ? "text-amber-500" : "text-green-500"
                  }`}>
                    {strength.text}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" className="border-slate-300 dark:border-slate-600 data-[state=checked]:bg-mrt-navy dark:data-[state=checked]:bg-mrt-gold" />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600 dark:text-slate-400"
                >
                  Remember me
                </label>
              </div>
            </div>

            <Button 
              type="submit" 
              className="group w-full h-12 bg-mrt-navy dark:bg-mrt-gold hover:bg-mrt-navy/90 dark:hover:bg-mrt-gold/90 text-white dark:text-slate-900 font-semibold text-lg transition-all active:scale-[0.98] relative overflow-hidden"
              disabled={isLoading || cooldownTime > 0}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign in
                  <ArrowRight className="w-5 h-5 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            <a href="#" className="hover:text-mrt-navy dark:hover:text-mrt-gold transition-colors font-medium">
              Need help? Contact IT Support
            </a>
          </div>

          <div className="mt-12 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono text-center">
              Demo Credentials<br/>
              Email: admin@mrt.org<br/>
              Password: admin123
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
