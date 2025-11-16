"use client"

import React from "react"
import { Progress } from "@/components/ui/progress"

export default function MetricBar({ label, value, color = "green" }: { label: string; value: number; color?: "green" | "blue" | "emerald" }) {
  const barColor = color === "green" ? "bg-green-600" : color === "blue" ? "bg-blue-600" : "bg-emerald-600"
  return (
    <div className="transition-all duration-200">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-800">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
      <div className={`-mt-2 h-2 rounded ${barColor}`} style={{ opacity: 0.1 }} />
    </div>
  )
}