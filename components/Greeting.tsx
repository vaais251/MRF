"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"

export function Greeting({ name }: { name: string }) {
  const [greeting, setGreeting] = useState("Good day")
  const [date, setDate] = useState("")

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good morning")
    else if (hour < 18) setGreeting("Good afternoon")
    else setGreeting("Good evening")

    setDate(format(new Date(), "EEEE, dd MMMM yyyy"))
  }, [])

  return (
    <div>
      <h2 className="text-3xl font-playfair font-bold text-slate-900 dark:text-white mb-1">
        {greeting}, {name}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 font-medium">
        {date}
      </p>
    </div>
  )
}
