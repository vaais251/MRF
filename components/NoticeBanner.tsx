"use client"

import { useState, useEffect } from "react"
import { AlertCircle, X } from "lucide-react"

export function NoticeBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const hidden = localStorage.getItem("mrt_beta_notice_hidden")
    if (!hidden) {
      setIsVisible(true)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem("mrt_beta_notice_hidden", "true")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 mb-6 relative rounded-r-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-amber-500" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
            Welcome to MRT M&E System Beta. Please report any issues to IT Support.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-amber-500 hover:text-amber-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
