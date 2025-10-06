"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Satellite, Brain, Loader2, MapIcon, RefreshCw, AlertCircle } from "lucide-react"
import { MapComponent } from "@/components/map-component"
import { AnalysisResults } from "@/components/analysis-results"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Coordinates {
  lat: number
  lng: number
}

interface AnalysisData {
  spectralAnalysis: any
  areaClassification: any
  temporalAnalysis?: any
  interpretation: string
  predictions?: any
  images: any
  location: any
  metadata: any
  timestamp: string
}

export default function AgroTraceDashboard() {
  const [cep, setCep] = useState("")
  const [cepError, setCepError] = useState("")
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [currentStep, setCurrentStep] = useState<"input" | "map" | "results">("input")
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Função para formatar e validar CEP em tempo real
  const handleCepChange = (value: string) => {
    // Remove tudo que não é número
    const onlyNumbers = value.replace(/\D/g, "")
    
    // Limita a 8 dígitos
    const limited = onlyNumbers.slice(0, 8)
    
    // Formata como 12345-678
    let formatted = limited
    if (limited.length > 5) {
      formatted = `${limited.slice(0, 5)}-${limited.slice(5)}`
    }
    
    setCep(formatted)
    
    // Validação em tempo real
    if (limited.length === 0) {
      setCepError("")
    } else if (limited.length < 8) {
      setCepError("CEP incompleto")
    } else {
      const cepNum = parseInt(limited)
      if (cepNum < 1000000 || cepNum > 99999999) {
        setCepError("CEP fora da faixa válida")
      } else {
        setCepError("")
      }
    }
  }

  const handleCepSubmit = async () => {
    if (!cep) {
      toast({
        title: "⚠️ CEP obrigatório",
        description: "Por favor, digite o CEP da sua fazenda",
        variant: "destructive",
      })
      return
    }

    // Limpar CEP (remover pontos e traços)
    const cleanCep = cep.replace(/\D/g, "")

    // Validações aprimoradas
    if (cleanCep.length !== 8) {
      toast({
        title: "⚠️ CEP inválido",
        description: "O CEP deve ter exatamente 8 números (ex: 12345-678)",
        variant: "destructive",
      })
      return
    }

    // Verificar se é um CEP válido (faixa brasileira)
    const cepNum = parseInt(cleanCep)
    if (cepNum < 1000000 || cepNum > 99999999) {
      toast({
        title: "⚠️ CEP fora da faixa",
        description: "Este CEP não está na faixa válida de CEPs brasileiros",
        variant: "destructive",
      })
      return
    }

    setIsLoadingCep(true)
    setError(null)

    // Feedback de progresso
    toast({
      title: "🔍 Buscando CEP...",
      description: "Aguarde, estamos localizando seu endereço",
    })

    try {
      console.log("🔍 Buscando CEP:", cleanCep)

      const response = await fetch(`/api/geocode?cep=${cleanCep}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(30000), // 30 segundos timeout
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Validar dados recebidos
      if (!data.lat || !data.lng) {
        throw new Error("Coordenadas não encontradas para este CEP")
      }

      setCoordinates({ lat: data.lat, lng: data.lng })
      setCurrentStep("map")
      setRetryCount(0)

      toast({
        title: "✅ CEP encontrado com sucesso!",
        description: `📍 ${data.details.localidade}, ${data.details.uf} - Clique no mapa para ajustar a localização exata`,
      })
    } catch (error) {
      console.error("❌ Erro ao buscar CEP:", error)

      let errorMessage = "Erro ao buscar CEP. Tente novamente."
      let errorTitle = "❌ Erro ao buscar CEP"

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "Tempo limite esgotado. Verifique sua conexão com a internet e tente novamente."
          errorTitle = "⏱️ Tempo esgotado"
        } else if (error.message.includes("fetch failed") || error.message.includes("Failed to fetch")) {
          errorMessage = "Erro de conexão. Verifique se você está conectado à internet."
          errorTitle = "🌐 Sem conexão"
        } else if (error.message.includes("não encontrado")) {
          errorMessage = "CEP não encontrado. Verifique se digitou corretamente."
          errorTitle = "🔍 CEP não encontrado"
        } else if (error.message.includes("Coordenadas não encontradas")) {
          errorMessage = "Não foi possível obter as coordenadas deste CEP. Tente outro CEP próximo."
          errorTitle = "📍 Localização indisponível"
        } else {
          errorMessage = error.message
        }
      }

      setError(errorMessage)
      
      // Opção de retry
      if (retryCount < 2) {
        toast({
          title: errorTitle,
          description: `${errorMessage} Tentando novamente... (${retryCount + 1}/3)`,
          variant: "destructive",
        })
        setRetryCount(retryCount + 1)
        
        // Retry automático após 2 segundos
        setTimeout(() => {
          handleCepSubmit()
        }, 2000)
      } else {
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoadingCep(false)
    }
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
    if (currentStep === "input") {
      handleCepSubmit()
    } else if (currentStep === "map") {
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
              <MapPin className="h-4 w-4" />
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
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span className="text-lg sm:text-xl">📍 Onde fica sua fazenda?</span>
              </CardTitle>
              <CardDescription>Digite o CEP da sua propriedade para começar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP da Fazenda</Label>
                <Input
                  id="cep"
                  placeholder="12345-678"
                  value={cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  maxLength={9}
                  disabled={isLoadingCep}
                  className={`text-base ${cepError && cep ? "border-red-500" : ""}`}
                  autoComplete="postal-code"
                  inputMode="numeric"
                />
                {cepError && cep && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {cepError}
                  </p>
                )}
                {!cepError && cep.replace(/\D/g, "").length === 8 && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    ✓ CEP válido
                  </p>
                )}
                <p className="text-xs text-gray-500">💡 Digite 8 números do CEP da sua propriedade</p>
              </div>
              <Button 
                onClick={handleCepSubmit} 
                className="w-full text-base" 
                size="lg" 
                disabled={isLoadingCep || cep.replace(/\D/g, "").length !== 8 || !!cepError}
              >
                {isLoadingCep ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando CEP...
                  </>
                ) : (
                  <>🔍 Buscar Localização</>
                )}
              </Button>

              {/* Dicas para problemas de conexão */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                <p className="text-xs text-blue-700 font-medium mb-1">💡 Dicas se der erro:</p>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• Verifique sua conexão com a internet</li>
                  <li>• Confirme se o CEP está correto</li>
                  <li>• Tente novamente em alguns segundos</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "map" && coordinates && (
          <div className="space-y-6">
            <Card className="mx-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapIcon className="h-5 w-5" />
                  <span className="text-lg sm:text-xl">🗺️ Ajustar Localização da Fazenda</span>
                </CardTitle>
                <CardDescription className="text-sm">Mova o marcador vermelho para a posição exata da sua fazenda</CardDescription>
              </CardHeader>
              <CardContent>
                <MapComponent initialCoordinates={coordinates} onLocationSelect={handleLocationSelect} />
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Button variant="outline" onClick={() => setCurrentStep("input")} size="lg" className="w-full sm:w-auto">
                ← Voltar
              </Button>
              <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full sm:min-w-40 sm:w-auto" size="lg">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Satellite className="h-4 w-4 mr-2" />🚀 Analisar Fazenda
                  </>
                )}
              </Button>
            </div>

            {/* Informações sobre o tempo de análise */}
            {isAnalyzing && (
              <Card className="border-blue-200 bg-blue-50 mx-4">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-600" />
                    <h3 className="font-semibold text-blue-900 mb-2">🛰️ Processando dados do satélite...</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Estamos baixando e analisando imagens de alta resolução. Isso pode demorar até 2 minutos.
                    </p>
                    <div className="text-xs text-blue-600 space-y-1 text-left sm:text-center">
                      <p>• Conectando com Sentinel Hub</p>
                      <p>• Baixando 7 tipos de imagens diferentes</p>
                      <p>• Processando dados espectrais</p>
                      <p>• Gerando análise com IA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {currentStep === "results" && analysisData && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📊 Resultado da Análise</h2>
                <p className="text-sm sm:text-base text-gray-600">
                  Análise concluída em {new Date(analysisData.timestamp).toLocaleString("pt-BR")}
                </p>
              </div>
              <Button onClick={resetAnalysis} variant="outline" size="lg" className="w-full sm:w-auto">
                🔄 Nova Análise
              </Button>
            </div>

            <div className="px-4">
              <AnalysisResults data={analysisData} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}