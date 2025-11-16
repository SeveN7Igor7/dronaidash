"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"

export default function StatCard({
  title,
  value,
  delta,
  hint,
  color = "green",
  icon,
}: {
  title: string
  value: string
  delta?: string
  hint?: string
  color?: "green" | "blue" | "orange" | "rose"
  icon: React.ReactNode
}) {
  const colorClasses: Record<string, string> = {
    green: "from-green-500 to-emerald-500",
    blue: "from-blue-500 to-cyan-500",
    orange: "from-amber-500 to-orange-500",
    rose: "from-rose-500 to-pink-500",
  }

  return (
    <Card className="group border-0 bg-gradient-to-br from-slate-50 to-white shadow-sm transition-shadow hover:shadow-lg transform-gpu hover:-translate-y-0.5">
      <CardContent className="p-4">
        <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white`}>{icon}</div>
        <div className="text-sm text-slate-600">{title}</div>
        <div className="mt-1 text-xl font-bold text-slate-800">{value}</div>
        {delta ? <div className="text-xs text-slate-500">{delta}</div> : null}
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </CardContent>
    </Card>
  )
}