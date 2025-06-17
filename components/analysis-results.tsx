"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Camera,
  BarChart3,
  Calendar,
  Target,
  Eye,
  Brain,
  Activity,
  MapPin,
  Clock,
} from "lucide-react"
import Image from "next/image"

interface AnalysisData {
  spectralAnalysis: {
    ndvi: { mean: number; std: number; min: number; max: number }
    evi: { mean: number; std: number }
    savi: { mean: number; std: number }
    landCover: {
      vegetation: number
      urban: number
      water: number
      bareSoil: number
      other: number
    }
    dominantLandUse: string
    visualAnalysis?: {
      patterns?: {
        geometricPatterns: number
        edgeDetection: number
        colorVariation: number
      }
      colorAnalysis?: {
        dominantColors: string[]
        colorDiversity: number
      }
    }
  }
  areaClassification: {
    classification: string
    confidence: number
    description: string
    isAgricultural: boolean
    isUrban: boolean
    needsAttention: boolean
    urbanizationLevel: number
    vegetationHealth: number
    scores?: {
      urban: number
      rural: number
    }
  }
  temporalAnalysis?: {
    trend: {
      direction: string
      magnitude: number
      confidence: string
    }
    seasonalPattern: string
  }
  interpretation: string
  predictions?: {
    predictions: string[]
    recommendations: string[]
    nextAnalysisDate: string
    monitoringPlan: any
    aiResponse: string
  }
  images: {
    rgb: string
    ndvi: string
    evi: string
    savi: string
    urban: string
  }
  location: { lat: number; lng: number }
  metadata: {
    confidence: number
    analysisVersion: string
    processingDate: string
  }
  timestamp: string
  analysisId?: string
}

// Função auxiliar para formatar números com segurança
const safeToFixed = (value: any, decimals = 1): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "0"
  }
  return Number(value).toFixed(decimals)
}

interface AnalysisResultsProps {
  data: AnalysisData
}

export function AnalysisResults({ data }: AnalysisResultsProps) {
  const { spectralAnalysis, areaClassification, temporalAnalysis, interpretation, predictions, images, metadata } = data

  const getClassificationIcon = (classification: string) => {
    if (classification.includes("urban")) return <XCircle className="h-6 w-6 text-red-600" />
    if (classification.includes("agricultural_healthy")) return <CheckCircle className="h-6 w-6 text-green-600" />
    if (classification.includes("agricultural")) return <AlertTriangle className="h-6 w-6 text-yellow-600" />
    return <AlertTriangle className="h-6 w-6 text-gray-600" />
  }

  const getClassificationColor = (classification: string) => {
    if (classification.includes("urban")) return "bg-red-500"
    if (classification.includes("agricultural_healthy")) return "bg-green-500"
    if (classification.includes("agricultural")) return "bg-yellow-500"
    return "bg-gray-500"
  }

  const getClassificationMessage = (classification: string, isUrban: boolean) => {
    if (isUrban) return "🏘️ ÁREA URBANA DETECTADA - Não é fazenda!"
    if (classification === "agricultural_healthy") return "🌟 FAZENDA SAUDÁVEL - Parabéns!"
    if (classification.includes("agricultural")) return "🌱 FAZENDA DETECTADA - Precisa cuidados"
    if (classification === "water_body") return "🌊 ÁREA DE ÁGUA - Rio, lago ou represa"
    if (classification === "bare_soil") return "🏜️ SOLO EXPOSTO - Área sem plantação"
    return "❓ ÁREA MISTA - Difícil classificar"
  }

  const getTrendIcon = (direction: string) => {
    if (direction === "improving") return <TrendingUp className="h-5 w-5 text-green-600" />
    if (direction === "declining") return <TrendingDown className="h-5 w-5 text-red-600" />
    return <Activity className="h-5 w-5 text-blue-600" />
  }

  const visualAnalysis = spectralAnalysis?.visualAnalysis || {}
  const patterns = visualAnalysis?.patterns || {}
  const colorAnalysis = visualAnalysis?.colorAnalysis || {}

  return (
    <div className="space-y-6">
      {/* ALERTA CRÍTICO PARA ÁREAS URBANAS */}
      {areaClassification.isUrban && (
        <Alert variant="destructive" className="border-2 border-red-300">
          <XCircle className="h-5 w-5" />
          <AlertTitle className="text-lg">🚨 ATENÇÃO: ESTA NÃO É UMA FAZENDA!</AlertTitle>
          <AlertDescription className="text-base">
            <strong>
              Área urbana detectada com {areaClassification.urbanizationLevel.toFixed(0)}% de construções.
            </strong>
            <br />
            Esta análise não é válida para fins agrícolas. Verifique se selecionou a localização correta da sua fazenda.
          </AlertDescription>
        </Alert>
      )}

      {/* RESULTADO PRINCIPAL */}
      <Card className={`border-2 ${areaClassification.isUrban ? "border-red-200" : "border-green-200"}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">{getClassificationIcon(areaClassification.classification)}</div>
          <CardTitle className="text-2xl">
            {getClassificationMessage(areaClassification.classification, areaClassification.isUrban)}
          </CardTitle>
          <CardDescription className="text-lg">
            Confiança da análise: {safeToFixed(areaClassification.confidence * 100, 0)}% | Versão{" "}
            {metadata.analysisVersion}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {safeToFixed(spectralAnalysis?.landCover?.vegetation, 0)}%
              </div>
              <div className="text-sm text-blue-700">🌱 Vegetação</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {safeToFixed(spectralAnalysis?.landCover?.urban, 0)}%
              </div>
              <div className="text-sm text-red-700">🏘️ Área Urbana</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {safeToFixed(spectralAnalysis?.landCover?.bareSoil, 0)}%
              </div>
              <div className="text-sm text-yellow-700">🏜️ Solo Exposto</div>
            </div>
            <div className="text-center p-3 bg-cyan-50 rounded-lg">
              <div className="text-2xl font-bold text-cyan-600">
                {safeToFixed(spectralAnalysis?.landCover?.water, 0)}%
              </div>
              <div className="text-sm text-cyan-700">🌊 Água</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ANÁLISE TEMPORAL (só para áreas agrícolas) */}
      {temporalAnalysis && areaClassification.isAgricultural && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />📈 Como sua fazenda está evoluindo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getTrendIcon(temporalAnalysis.trend.direction)}
                <div>
                  <div className="font-semibold">
                    {temporalAnalysis.trend.direction === "improving" && "📈 Melhorando"}
                    {temporalAnalysis.trend.direction === "declining" && "📉 Piorando"}
                    {temporalAnalysis.trend.direction === "stable" && "📊 Estável"}
                  </div>
                  <div className="text-sm text-gray-600">
                    Confiança: {temporalAnalysis.trend.confidence} | Padrão: {temporalAnalysis.seasonalPattern}
                  </div>
                </div>
              </div>
              <Badge
                variant={
                  temporalAnalysis.trend.direction === "improving"
                    ? "default"
                    : temporalAnalysis.trend.direction === "declining"
                      ? "destructive"
                      : "secondary"
                }
              >
                {temporalAnalysis.trend.direction === "improving" && "Tendência Positiva"}
                {temporalAnalysis.trend.direction === "declining" && "Tendência Negativa"}
                {temporalAnalysis.trend.direction === "stable" && "Tendência Estável"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PREVISÕES E RECOMENDAÇÕES (só para áreas agrícolas) */}
      {predictions && areaClassification.isAgricultural && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />🔮 Previsões para os próximos 30 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {predictions.predictions.map((prediction, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-sm">{prediction}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />💡 O que fazer agora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {predictions.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PRÓXIMA ANÁLISE (só para áreas agrícolas) */}
      {predictions?.nextAnalysisDate && areaClassification.isAgricultural && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-blue-600" />
                <div>
                  <div className="font-semibold text-blue-900">📅 Próxima análise recomendada</div>
                  <div className="text-blue-700">
                    {new Date(predictions.nextAnalysisDate).toLocaleDateString("pt-BR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
              <Button variant="outline" className="border-blue-300 text-blue-700">
                <Clock className="h-4 w-4 mr-2" />
                Agendar Lembrete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TABS DETALHADAS */}
      <Tabs defaultValue="relatorio" className="w-full">
        <TabsList className="grid w-full grid-cols-6 gap-2">
          <TabsTrigger value="relatorio" className="flex flex-col items-center p-3">
            <Brain className="h-4 w-4 mb-1" />
            <span className="text-xs">📋 Relatório IA</span>
          </TabsTrigger>
          <TabsTrigger value="imagens" className="flex flex-col items-center p-3">
            <Camera className="h-4 w-4 mb-1" />
            <span className="text-xs">📸 Imagens</span>
          </TabsTrigger>
          <TabsTrigger value="dados" className="flex flex-col items-center p-3">
            <BarChart3 className="h-4 w-4 mb-1" />
            <span className="text-xs">📊 Dados Técnicos</span>
          </TabsTrigger>
          <TabsTrigger value="visual" className="flex flex-col items-center p-3">
            <Eye className="h-4 w-4 mb-1" />
            <span className="text-xs">📊 Análise Visual</span>
          </TabsTrigger>
          <TabsTrigger value="monitoramento" className="flex flex-col items-center p-3">
            <Eye className="h-4 w-4 mb-1" />
            <span className="text-xs">👁️ Monitoramento</span>
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex flex-col items-center p-3">
            <Clock className="h-4 w-4 mb-1" />
            <span className="text-xs">📊 Histórico</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="relatorio">
          <Card>
            <CardHeader>
              <CardTitle>🤖 Análise Completa por Inteligência Artificial</CardTitle>
              <CardDescription>Interpretação detalhada dos dados coletados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-lg max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{interpretation}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imagens">
          {/* DEBUG: Mostrar estrutura das imagens */}
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">🔍 Debug - Estrutura das Imagens:</h4>
            <pre className="text-xs text-yellow-700 overflow-auto">
              {JSON.stringify(images, null, 2).substring(0, 500)}...
            </pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📸 Foto Real</CardTitle>
                <CardDescription>Como a área aparece do satélite</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {images?.rgb && typeof images.rgb === "string" && images.rgb.trim() !== "" ? (
                    <Image src={images.rgb || "/placeholder.svg"} alt="Imagem real" fill className="object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <Camera className="h-12 w-12 mb-2" />
                      <p>Imagem não disponível</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🌱 Saúde das Plantas</CardTitle>
                <CardDescription>Verde = saudável, Vermelho = problema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {images?.ndvi && typeof images.ndvi === "string" && images.ndvi.trim() !== "" ? (
                    <Image
                      src={images.ndvi || "/placeholder.svg"}
                      alt="Saúde das plantas"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <Activity className="h-12 w-12 mb-2" />
                      <p>Análise NDVI não disponível</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🔍 Análise Detalhada</CardTitle>
                <CardDescription>Análise aprimorada da vegetação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {images?.evi && typeof images.evi === "string" && images.evi.trim() !== "" ? (
                    <Image
                      src={images.evi || "/placeholder.svg"}
                      alt="Análise detalhada"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <BarChart3 className="h-12 w-12 mb-2" />
                      <p>Análise EVI não disponível</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🌍 Solo e Vegetação</CardTitle>
                <CardDescription>Relação entre solo e plantas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {images?.savi && typeof images.savi === "string" && images.savi.trim() !== "" ? (
                    <Image
                      src={images.savi || "/placeholder.svg"}
                      alt="Solo e vegetação"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <MapPin className="h-12 w-12 mb-2" />
                      <p>Análise SAVI não disponível</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🏘️ Detecção Urbana</CardTitle>
                <CardDescription>Magenta = urbano, Verde = natural</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {images?.urban && typeof images.urban === "string" && images.urban.trim() !== "" ? (
                    <Image
                      src={images.urban || "/placeholder.svg"}
                      alt="Detecção urbana"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <XCircle className="h-12 w-12 mb-2" />
                      <p>Análise urbana não disponível</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dados">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>📊 Índices Espectrais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>NDVI (Vegetação)</span>
                    <span>{safeToFixed(spectralAnalysis?.ndvi?.mean, 3)}</span>
                  </div>
                  <Progress value={((spectralAnalysis?.ndvi?.mean || 0) + 1) * 50} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>EVI (Aprimorado)</span>
                    <span>{safeToFixed(spectralAnalysis?.evi?.mean, 3)}</span>
                  </div>
                  <Progress value={((spectralAnalysis?.evi?.mean || 0) + 1) * 50} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>SAVI (Ajustado Solo)</span>
                    <span>{safeToFixed(spectralAnalysis?.savi?.mean, 3)}</span>
                  </div>
                  <Progress value={((spectralAnalysis?.savi?.mean || 0) + 1) * 50} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🗺️ Cobertura do Solo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>🌱 Vegetação</span>
                    <Badge variant="outline">{safeToFixed(spectralAnalysis?.landCover?.vegetation, 1)}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>🏘️ Área Urbana</span>
                    <Badge variant={(spectralAnalysis?.landCover?.urban || 0) > 30 ? "destructive" : "outline"}>
                      {safeToFixed(spectralAnalysis?.landCover?.urban, 1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>🏜️ Solo Exposto</span>
                    <Badge variant="outline">{safeToFixed(spectralAnalysis?.landCover?.bareSoil, 1)}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>🌊 Água</span>
                    <Badge variant="outline">{safeToFixed(spectralAnalysis?.landCover?.water, 1)}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="visual">
          <Card>
            <CardHeader>
              <CardTitle>👁️ Análise de Padrões Visuais</CardTitle>
              <CardDescription>Detecção automática de padrões na imagem</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">🏗️ Padrões Detectados</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Padrões Geométricos</span>
                      <Badge>{safeToFixed(patterns?.geometricPatterns, 1)}%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Detecção de Bordas</span>
                      <Badge>{safeToFixed(patterns?.edgeDetection, 1)}%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Variação de Cor</span>
                      <Badge>{safeToFixed(patterns?.colorVariation, 1)}%</Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">🎯 Pontuações</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>🏘️ Pontuação Urbana</span>
                      <Badge variant={areaClassification?.scores?.urban > 50 ? "destructive" : "outline"}>
                        {areaClassification?.scores?.urban || 0}/100
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>🌾 Pontuação Rural</span>
                      <Badge variant={areaClassification?.scores?.rural > 50 ? "default" : "outline"}>
                        {areaClassification?.scores?.rural || 0}/100
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoramento">
          {areaClassification.isAgricultural && predictions?.monitoringPlan ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>📋 Plano de Monitoramento</CardTitle>
                  <CardDescription>Como acompanhar sua fazenda</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">📅 Frequência</h4>
                      <Badge variant="outline" className="text-base p-2">
                        {predictions.monitoringPlan.frequency}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">📊 Parâmetros</h4>
                      <div className="space-y-2">
                        {predictions.monitoringPlan.parameters.map((param: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {param}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {predictions.monitoringPlan.alerts.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">🚨 Alertas</h4>
                      <div className="space-y-2">
                        {predictions.monitoringPlan.alerts.map((alert: string, index: number) => (
                          <Alert key={index}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{alert}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Monitoramento não disponível</h3>
                <p className="text-gray-600">
                  {areaClassification.isUrban
                    ? "Área urbana detectada - monitoramento agrícola não aplicável"
                    : "Selecione uma área agrícola para ativar o monitoramento"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>📊 Histórico de Análises</CardTitle>
              <CardDescription>Registro completo desta análise</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">📋 Informações da Análise</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>ID da Análise:</span>
                        <code className="bg-gray-100 px-2 py-1 rounded">{data.analysisId || "N/A"}</code>
                      </div>
                      <div className="flex justify-between">
                        <span>Data/Hora:</span>
                        <span>{new Date(data.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Versão do Algoritmo:</span>
                        <span>{metadata.analysisVersion}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">📍 Localização</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Latitude:</span>
                        <span>{safeToFixed(data.location.lat, 6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Longitude:</span>
                        <span>{safeToFixed(data.location.lng, 6)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">📝 Notas Adicionais</h4>
                  <p className="text-sm text-gray-700">
                    Esta análise foi gerada automaticamente. Para mais detalhes ou suporte, entre em contato com nossa
                    equipe.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
