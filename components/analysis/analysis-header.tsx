"use client"

import { Button } from "@/components/ui/button"
import type { AnalysisData } from "@/lib/types"

interface AnalysisHeaderProps {
  data: AnalysisData
  onReset: () => void
}

export function AnalysisHeader({ data, onReset }: AnalysisHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-0">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📊 Resultado da Análise</h2>
        <p className="text-sm sm:text-base text-gray-600">
          Análise concluída em {new Date(data.timestamp).toLocaleString("pt-BR")}
        </p>
      </div>
      <Button onClick={onReset} variant="outline" size="lg" className="w-full sm:w-auto">
        🔄 Nova Análise
      </Button>
    </div>
  )
}