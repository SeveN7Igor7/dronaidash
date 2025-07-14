"use client"

import { useState } from "react"
import { Satellite, Brain, Loader2, MapIcon, RefreshCw, AlertCircle } from "lucide-react"
import { CepForm } from "@/components/forms/cep-form"
import { MapSelector } from "@/components/maps/map-selector"
import { AnalysisResults } from "@/components/analysis-results"
import { AnalysisHeader } from "@/components/analysis/analysis-header"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { Coordinates, AnalysisData } from "@/lib/types"

export default function AgroTraceDashboard() {
  const [cep, setCep] = useState("")
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [currentStep, setCurrentStep] = useState<"input" | "map" | "results">("input")
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const handleLocationFound = (coords: Coordinates) => {
    setCoordinates(coords)
    setCurrentStep("map")
    setError(null)
    setRetryCount(0)
  }

  const handleLocationSelect = (coords: Coordinates) => {
    setCoordinates(coords)
    setError(null)
  }

  const handleAnalyze = async () => {
    if (!coordinates) {
      toast({
        title: "⚠️ Localização necessária",
        description: "Selecione uma localização no mapa primeiro",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      toast({
        title: "🛰️ Iniciando análise",
        description: "Conectando com satélite... isso pode demorar até 2 minutos",
      })

      const response = await fetch("/api/analyze-farm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates: coordinates,
          cep: cep,
        }),
        signal: AbortSignal.timeout(120000), // 2 minutos timeout
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setAnalysisData(data)
      setCurrentStep("results")
      setRetryCount(0)

      toast({
        title: "✅ Análise concluída!",
        description: "Os dados da sua fazenda foram processados com sucesso",
      })
    } catch (error) {
      console.error("❌ Erro na análise:", error)

      let errorMessage = "Erro ao analisar fazenda. Tente novamente."

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "Análise demorou muito. Tente novamente."
        } else if (error.message.includes("fetch failed")) {
          errorMessage = "Erro de conexão durante análise."
        } else {
          errorMessage = error.message
        }
      }

      setError(errorMessage)
      setRetryCount((prev) => prev + 1)

      toast({
        title: "❌ Erro na análise",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetAnalysis = () => {
    setCurrentStep("input")
    setCoordinates(null)
    setAnalysisData(null)
    setCep("")
    setError(null)
    setRetryCount(0)
  }

  const retryCurrentAction = () => {
    setError(null)
    if (currentStep === "map") {
      handleAnalyze()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4 px-4">
            <Satellite className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">AgroTrace</h1>
          </div>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            🌱 Análise da sua fazenda usando satélite e inteligência artificial
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 px-4">
          <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                currentStep === "input"
                  ? "bg-green-100 text-green-700 border-2 border-green-300"
                  : currentStep === "map" || currentStep === "results"
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              <div className="h-4 w-4">📍</div>
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">1. CEP</span>
            </div>
            <div className="w-4 sm:w-8 h-0.5 bg-gray-300 flex-shrink-0"></div>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                currentStep === "map"
                  ? "bg-green-100 text-green-700 border-2 border-green-300"
                  : currentStep === "results"
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              <MapIcon className="h-4 w-4" />
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">2. Mapa</span>
            </div>
            <div className="w-4 sm:w-8 h-0.5 bg-gray-300 flex-shrink-0"></div>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                currentStep === "results"
                  ? "bg-green-100 text-green-700 border-2 border-green-300"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <Brain className="h-4 w-4" />
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">3. Resultado</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto mx-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro encontrado</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span>{error}</span>
              <Button onClick={retryCurrentAction} variant="outline" size="sm" className="sm:ml-4 w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente {retryCount > 0 && `(${retryCount + 1}ª tentativa)`}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Content */}
        {currentStep === "input" && (
          <CepForm onLocationFound={handleLocationFound} />
        )}

        {currentStep === "map" && coordinates && (
          <MapSelector
            coordinates={coordinates}
            onLocationSelect={handleLocationSelect}
            onAnalyze={handleAnalyze}
            onBack={() => setCurrentStep("input")}
            isAnalyzing={isAnalyzing}
          />
        )}

        {currentStep === "results" && analysisData && (
          <div className="space-y-6">
            <AnalysisHeader data={analysisData} onReset={resetAnalysis} />

            <div className="px-4">
              <AnalysisResults data={analysisData} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}