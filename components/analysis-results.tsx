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
  Leaf,
  Droplet,
  Zap,
  Wind,
  Gauge,
  Award,
  Download,
  Share2,
  AlertCircle,
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

  // DEBUG: Log all incoming data
  console.log("=== ANALYSIS DATA RECEIVED ===")
  console.log("1. AREA CLASSIFICATION:", {
    classification: areaClassification.classification,
    isUrban: areaClassification.isUrban,
    isAgricultural: areaClassification.isAgricultural,
    confidence: areaClassification.confidence,
    urbanizationLevel: areaClassification.urbanizationLevel,
    vegetationHealth: areaClassification.vegetationHealth,
    scores: areaClassification.scores,
  })
  console.log("2. LAND COVER (RAW):", spectralAnalysis?.landCover)
  console.log("3. SPECTRAL INDICES:", {
    ndvi: spectralAnalysis?.ndvi,
    evi: spectralAnalysis?.evi,
    savi: spectralAnalysis?.savi,
  })
  console.log("4. VISUAL PATTERNS:", spectralAnalysis?.visualAnalysis?.patterns)

  // INTELLIGENT CLASSIFICATION - Respect AI's analysis first
  const classifyAreaType = () => {
    // 1️⃣ PRIORITY: Check AI's explicit classification
    const aiClassification = areaClassification?.classification?.toLowerCase() || ''
    const aiIsRural = aiClassification.includes('rural') || aiClassification.includes('agricultural')
    const aiIsUrban = aiClassification.includes('urban') || aiClassification.includes('urbana')
    
    console.log("🤖 AI Classification:", aiClassification, { aiIsRural, aiIsUrban })
    
    // Get all classification signals
    const urbanScore = areaClassification?.scores?.urban || 0
    const ruralScore = areaClassification?.scores?.rural || 0
    const backendIsUrban = areaClassification?.isUrban || false
    const backendIsAgricultural = areaClassification?.isAgricultural || false
    
    // Visual pattern analysis
    const geometricPatterns = (spectralAnalysis?.visualAnalysis?.patterns as any)?.geometricPatterns || 0
    const edgeDetection = (spectralAnalysis?.visualAnalysis?.patterns as any)?.edgeDetection || 0
    const colorVariation = (spectralAnalysis?.visualAnalysis?.patterns as any)?.colorVariation || 0
    
    // Land cover data
    const reportedUrban = Number(spectralAnalysis?.landCover?.urban) || 0
    const reportedBareSoil = Number(spectralAnalysis?.landCover?.bareSoil) || 0
    const reportedVeg = Number(spectralAnalysis?.landCover?.vegetation) || 0
    
    // NDVI analysis
    const ndvi = Number(spectralAnalysis?.ndvi?.mean) || 0
    const lowVegetationHealth = ndvi < 0.3
    
    // 2️⃣ If AI explicitly says RURAL/AGRICULTURAL - TRUST IT
    if (aiIsRural) {
      console.log("✅ AI says RURAL - respecting classification")
      return {
        isUrban: false,
        isAgricultural: true,
        displayName: "🌾 AGRÍCOLA",
        subtitle: "Classificação por IA: " + areaClassification?.classification,
        color: "green",
        icon: <CheckCircle className="h-8 w-8 text-green-600" />,
        corrected: false,
      }
    }
    
    // 3️⃣ If AI explicitly says URBAN - apply corrections if needed
    if (aiIsUrban) {
      const highBareSoilSuspect = reportedBareSoil > 70 && reportedUrban < 5
      console.log("⚠️ AI says URBAN - checking for data corrections needed:", { highBareSoilSuspect })
      
      return {
        isUrban: true,
        isAgricultural: false,
        displayName: "🏘️ URBANA",
        subtitle: "Área urbana detectada por análise visual",
        color: "red",
        icon: <XCircle className="h-8 w-8 text-red-600" />,
        corrected: highBareSoilSuspect,
      }
    }
    
    // 4️⃣ Fallback: Use visual patterns only if AI didn't provide clear classification
    const visuallyUrban = geometricPatterns > 40 || edgeDetection > 50
    const hasUrbanPatterns = colorVariation > 60 && lowVegetationHealth
    const highBareSoilSuspect = reportedBareSoil > 70 && reportedUrban < 5
    
    const isDefinitelyUrban = 
      backendIsUrban || 
      urbanScore > 50 || 
      visuallyUrban ||
      hasUrbanPatterns ||
      highBareSoilSuspect
    
    if (isDefinitelyUrban) {
      console.log("⚠️ No AI classification, but visual patterns suggest URBAN")
      return {
        isUrban: true,
        isAgricultural: false,
        displayName: "🏘️ URBANA",
        subtitle: "Área urbana detectada por padrões visuais",
        color: "red",
        icon: <XCircle className="h-8 w-8 text-red-600" />,
        corrected: highBareSoilSuspect,
      }
    }

    // Agricultural detection
    if (backendIsAgricultural || ruralScore > 60 || (reportedVeg > 40 && !visuallyUrban)) {
      return {
        isUrban: false,
        isAgricultural: true,
        displayName: "🌾 AGRÍCOLA",
        subtitle: "Avaliação agrícola com IA",
        color: "green",
        icon: <CheckCircle className="h-8 w-8 text-green-600" />,
        corrected: false,
      }
    }

    // Mixed/uncertain
    return {
      isUrban: false,
      isAgricultural: false,
      displayName: "🗺️ MISTA",
      subtitle: "Área com uso misto do solo",
      color: "amber",
      icon: <Gauge className="h-8 w-8 text-amber-600" />,
      corrected: false,
    }
  }

  const classificationResult = classifyAreaType()

  const getClassificationIcon = (classification: string) => {
    if (classification.includes("urban")) return <XCircle className="h-8 w-8 text-red-600" />
    if (classification.includes("agricultural_healthy")) return <CheckCircle className="h-8 w-8 text-green-600" />
    if (classification.includes("agricultural")) return <AlertTriangle className="h-8 w-8 text-yellow-600" />
    return <Gauge className="h-8 w-8 text-gray-600" />
  }

  const getTrendIcon = (direction: string) => {
    if (direction === "improving") return <TrendingUp className="h-5 w-5 text-green-600" />
    if (direction === "declining") return <TrendingDown className="h-5 w-5 text-red-600" />
    return <Activity className="h-5 w-5 text-blue-600" />
  }

  const visualAnalysis = spectralAnalysis?.visualAnalysis || {}
  const patterns = visualAnalysis?.patterns || {}
  const ndviValue = Number(spectralAnalysis?.ndvi?.mean) || 0
  const eviValue = Number(spectralAnalysis?.evi?.mean) || 0
  const saviValue = Number(spectralAnalysis?.savi?.mean) || 0
  
  // Get raw backend data
  const rawUrbanLevel = Number(spectralAnalysis?.landCover?.urban) || 0
  const rawBareSoilLevel = Number(spectralAnalysis?.landCover?.bareSoil) || 0
  const waterLevel = Number(spectralAnalysis?.landCover?.water) || 0
  const otherLevel = Number(spectralAnalysis?.landCover?.other) || 0
  
  console.log("=== RAW LAND COVER VALUES ===")
  console.log("Urban:", rawUrbanLevel + "%")
  console.log("Bare Soil:", rawBareSoilLevel + "%")
  console.log("Water:", waterLevel + "%")
  console.log("Other:", otherLevel + "%")
  
  // INTELLIGENT URBAN CORRECTION
  const geometricPatterns = (spectralAnalysis?.visualAnalysis?.patterns as any)?.geometricPatterns || 0
  const edgeDetection = (spectralAnalysis?.visualAnalysis?.patterns as any)?.edgeDetection || 0
  const colorVariation = (spectralAnalysis?.visualAnalysis?.patterns as any)?.colorVariation || 0
  
  console.log("=== VISUAL PATTERNS ===")
  console.log("Geometric Patterns:", geometricPatterns + "%")
  console.log("Edge Detection:", edgeDetection + "%")
  console.log("Color Variation:", colorVariation + "%")
  
  // MULTIPLE DETECTION METHODS
  const method1_HighBareSoilLowUrban = rawBareSoilLevel > 70 && rawUrbanLevel < 5
  const method2_UrbanPatterns = geometricPatterns > 40 || edgeDetection > 50
  const method3_BackendSaysUrban = areaClassification?.isUrban === true
  const method4_HighUrbanScore = (areaClassification?.scores?.urban || 0) > 50
  const method5_HighColorVariation = colorVariation > 60 && rawBareSoilLevel > 50
  
  // DECISION: Is this area urban? Only correct if classification says so
  const isDefinitelyUrban = method1_HighBareSoilLowUrban || method2_UrbanPatterns || method3_BackendSaysUrban || method4_HighUrbanScore || method5_HighColorVariation
  
  console.log("=== URBAN DETECTION METHODS ===")
  console.log("Method 1 - High Bare Soil + Low Urban:", method1_HighBareSoilLowUrban)
  console.log("Method 2 - Urban Patterns Detected:", method2_UrbanPatterns)
  console.log("Method 3 - Backend Says Urban:", method3_BackendSaysUrban)
  console.log("Method 4 - High Urban Score:", method4_HighUrbanScore)
  console.log("Method 5 - High Color Variation:", method5_HighColorVariation)
  console.log("FINAL DECISION - IS URBAN:", isDefinitelyUrban)
  console.log("CLASSIFICATION RESULT:", classificationResult.isUrban)
  
  // Calculate corrected urban level - ONLY if classification agrees
  let urbanLevel = rawUrbanLevel
  let correctedBareSoil = rawBareSoilLevel
  let correctionApplied = false
  
  // 🔑 KEY FIX: Only apply correction if BOTH detection methods AND classification say urban
  const shouldApplyCorrection = classificationResult.isUrban && isDefinitelyUrban && method1_HighBareSoilLowUrban
  
  if (shouldApplyCorrection) {
    // Apply correction: assume 85% of "bare soil" is actually urban pavement
    urbanLevel = Math.min(95, rawBareSoilLevel * 0.85 + rawUrbanLevel)
    correctedBareSoil = Math.max(0, rawBareSoilLevel * 0.15)
    correctionApplied = true
    
    console.log("=== CORRECTION APPLIED ===")
    console.log("Original Urban:", rawUrbanLevel + "%")
    console.log("Corrected Urban:", urbanLevel + "%")
    console.log("Original Bare Soil:", rawBareSoilLevel + "%")
    console.log("Corrected Bare Soil:", correctedBareSoil + "%")
  } else {
    console.log("=== NO CORRECTION NEEDED ===")
    console.log("Classification is AGRICULTURAL - keeping original bare soil values")
  }
  
  // Calculate vegetation
  const totalNonVeg = urbanLevel + correctedBareSoil + waterLevel + otherLevel
  const vegetationFromBackend = Number(spectralAnalysis?.landCover?.vegetation) || 0
  const vegetationCoverage = vegetationFromBackend > 0 
    ? vegetationFromBackend 
    : Math.max(0, 100 - totalNonVeg)
  
  console.log("=== FINAL COVERAGE ===")
  console.log("Vegetation:", vegetationCoverage + "%")
  console.log("Urban:", urbanLevel + "%")
  console.log("Bare Soil:", correctedBareSoil + "%")
  console.log("Water:", waterLevel + "%")
  console.log("Total:", (vegetationCoverage + urbanLevel + correctedBareSoil + waterLevel) + "%")
  
  const healthScore = Math.round((Number(areaClassification.vegetationHealth) || 0) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-12">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 pt-12 pb-24 px-4 sm:px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                {classificationResult.icon}
                <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">Análise Completa</h1>
              </div>
              <p className="text-lg text-emerald-50">
                {classificationResult.subtitle}
              </p>
              <p className="text-sm text-emerald-100 mt-2">
                📅 {new Date(metadata.processingDate || Date.now()).toLocaleDateString("pt-BR")} às{" "}
                {new Date(metadata.processingDate || Date.now()).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="bg-white/20 border-white/40 text-white hover:bg-white/30">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" size="sm" className="bg-white/20 border-white/40 text-white hover:bg-white/30">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>

          {/* STATUS CARDS - VERTICAL LAYOUT */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <Card className="bg-white/95 backdrop-blur border-0 shadow-lg lg:col-span-2">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={`p-3 rounded-xl ${classificationResult.color === "red" ? "bg-red-100" : classificationResult.color === "amber" ? "bg-amber-100" : "bg-green-100"}`}>
                    {classificationResult.icon}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase">Classificação</p>
                    <p className="text-lg font-bold text-slate-900">{classificationResult.displayName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur border-0 shadow-lg lg:col-span-2">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-100">
                    <Gauge className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase">Confiança</p>
                    <p className="text-lg font-bold text-slate-900">{safeToFixed(areaClassification.confidence * 100, 0)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur border-0 shadow-lg lg:col-span-2">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-xl bg-purple-100">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase">Saúde</p>
                    <p className="text-lg font-bold text-slate-900">{healthScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 -mt-12">
        {/* CRITICAL ALERT - Urban area warning */}
        {classificationResult.isUrban && (
          <Alert variant="destructive" className="border-2 border-red-400 bg-red-50 shadow-lg">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-bold">🚨 ÁREA URBANA DETECTADA</AlertTitle>
            <AlertDescription className="text-base mt-2">
              <strong>Esta é uma área predominantemente urbana.</strong>
              <br className="my-2" />
              Características identificadas: construções, pavimentação, infraestrutura urbana.
              <br className="my-1" />
              ❌ <strong>Esta análise NÃO é apropriada para fins agrícolas.</strong>
            </AlertDescription>
          </Alert>
        )}

        {/* INFO ALERT - For mixed areas */}
        {!classificationResult.isUrban && !classificationResult.isAgricultural && (
          <Alert className="border-2 border-amber-400 bg-amber-50 shadow-lg">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-lg font-bold text-amber-900">ℹ️ ÁREA MISTA</AlertTitle>
            <AlertDescription className="text-base mt-2 text-amber-800">
              <strong>Uso misto do solo detectado:</strong> {safeToFixed(vegetationCoverage, 0)}% vegetação, {safeToFixed(urbanLevel, 0)}% urbano
              <br className="my-2" />
              Recomenda-se análise com cautela.
            </AlertDescription>
          </Alert>
        )}

        {/* DIAGNOSTIC CARD - Show all classification scores */}
        <Card className="border-2 border-blue-500 shadow-lg bg-blue-50">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6" />
              <div>
                <CardTitle className="text-xl">Análise de Classificação IA</CardTitle>
                <CardDescription className="text-blue-100">Scores e padrões detectados</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 mb-3">Scores de Classificação</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                    <span className="text-sm font-medium text-slate-700">🏘️ Score Urbano</span>
                    <span className="text-lg font-bold text-slate-900">{areaClassification?.scores?.urban || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                    <span className="text-sm font-medium text-slate-700">🌾 Score Rural</span>
                    <span className="text-lg font-bold text-slate-900">{areaClassification?.scores?.rural || 0}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 mb-3">Padrões Visuais</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                    <span className="text-sm font-medium text-slate-700">🔷 Geométricos</span>
                    <span className="text-lg font-bold text-slate-900">{safeToFixed((patterns as any)?.geometricPatterns, 1)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                    <span className="text-sm font-medium text-slate-700">📐 Detecção Bordas</span>
                    <span className="text-lg font-bold text-slate-900">{safeToFixed((patterns as any)?.edgeDetection, 1)}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 mb-3">Cobertura do Solo</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                    <span className="text-sm font-medium text-slate-700">Total Cobertura</span>
                    <span className="text-sm font-bold text-slate-900">{safeToFixed(vegetationCoverage + urbanLevel + correctedBareSoil + waterLevel, 1)}%</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-xs text-slate-600 mb-2">Distribuição:</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Vegetação:</span>
                        <span className="font-semibold">{safeToFixed(vegetationCoverage, 1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Urbano:</span>
                        <span className="font-semibold">{safeToFixed(urbanLevel, 1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Solo Exposto:</span>
                        <span className="font-semibold">{safeToFixed(correctedBareSoil, 1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Água:</span>
                        <span className="font-semibold">{safeToFixed(waterLevel, 1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI GRID - DADOS REAIS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <Leaf className="h-8 w-8 text-emerald-600" />
                <Badge className={vegetationCoverage > 50 ? "bg-green-100 text-green-800" : vegetationCoverage > 20 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}>
                  {vegetationCoverage > 50 ? "✓ Alta" : vegetationCoverage > 20 ? "⚠️ Moderada" : "❌ Baixa"}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 font-medium uppercase">Vegetação</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{safeToFixed(vegetationCoverage, 1)}%</p>
              <p className="text-xs text-slate-400 mt-1">NDVI: {safeToFixed(ndviValue, 3)}</p>
              <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-green-600" style={{ width: `${Math.min(vegetationCoverage, 100)}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <Badge className={urbanLevel < 5 ? "bg-green-100 text-green-800" : urbanLevel < 30 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}>
                  {urbanLevel < 5 ? "✓ Rural" : urbanLevel < 30 ? "⚠️ Semi-urbano" : "❌ Urbano"}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 font-medium uppercase">Área Urbana</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{safeToFixed(urbanLevel, 1)}%</p>
              <p className="text-xs text-slate-400 mt-1">Construções detectadas</p>
              <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-400 to-pink-600" style={{ width: `${Math.min(urbanLevel, 100)}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <Wind className="h-8 w-8 text-amber-600" />
                <Badge className={correctedBareSoil < 30 ? "bg-green-100 text-green-800" : correctedBareSoil < 60 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}>
                  {correctedBareSoil < 30 ? "✓ Baixo" : correctedBareSoil < 60 ? "⚠️ Moderado" : "❌ Alto"}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 font-medium uppercase">Solo Exposto</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{safeToFixed(correctedBareSoil, 1)}%</p>
              <p className="text-xs text-slate-400 mt-1">Risco de erosão</p>
              <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-orange-600" style={{ width: `${Math.min(correctedBareSoil, 100)}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <Droplet className="h-8 w-8 text-blue-600" />
                <Badge className="bg-blue-100 text-blue-800">
                  {waterLevel > 5 ? "Detectada" : "Mínima"}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 font-medium uppercase">Água</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{safeToFixed(waterLevel, 1)}%</p>
              <p className="text-xs text-slate-400 mt-1">Corpos d'água</p>
              <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-600" style={{ width: `${Math.min(waterLevel, 100)}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SPECTRAL INDICES - IMPROVED */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-lg">
            <div className="flex items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6" />
                <div>
                  <CardTitle className="text-xl">Índices Espectrais Avançados</CardTitle>
                  <CardDescription className="text-slate-300">Análise de indicadores de saúde da vegetação</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-900 text-lg">NDVI</h4>
                    <Badge className="bg-green-100 text-green-800 text-xs font-semibold">🌱 Veg</Badge>
                  </div>
                  <p className="text-5xl font-bold text-green-600 mb-2">{safeToFixed(ndviValue, 3)}</p>
                  <p className="text-xs text-slate-600 mb-4 font-medium">Índice Normalizado de Vegetação</p>
                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div className="bg-white p-2 rounded border border-green-100">
                      <p className="text-xs text-slate-500">MIN</p>
                      <p className="text-sm font-bold text-slate-900">{safeToFixed(spectralAnalysis?.ndvi?.min, 2)}</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-green-100">
                      <p className="text-xs text-slate-500">MÉD</p>
                      <p className="text-sm font-bold text-slate-900">{safeToFixed(ndviValue, 2)}</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-green-100">
                      <p className="text-xs text-slate-500">MÁX</p>
                      <p className="text-sm font-bold text-slate-900">{safeToFixed(spectralAnalysis?.ndvi?.max, 2)}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between text-slate-700">
                      <span>Desvio padrão (σ):</span>
                      <span className="font-semibold">{safeToFixed(spectralAnalysis?.ndvi?.std, 3)}</span>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-300 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-600" style={{ width: `${Math.min(((ndviValue + 1) / 2) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border-2 border-blue-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-900 text-lg">EVI</h4>
                    <Badge className="bg-blue-100 text-blue-800 text-xs font-semibold">📊 Aprim</Badge>
                  </div>
                  <p className="text-5xl font-bold text-blue-600 mb-2">{safeToFixed(eviValue, 3)}</p>
                  <p className="text-xs text-slate-600 mb-4 font-medium">Índice de Vegetação Aprimorado</p>
                  <div className="grid grid-cols-2 gap-2 text-center mb-4">
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-slate-500">VALOR</p>
                      <p className="text-sm font-bold text-slate-900">{safeToFixed(eviValue, 2)}</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-slate-500">σ</p>
                      <p className="text-sm font-bold text-slate-900">{safeToFixed(spectralAnalysis?.evi?.std, 2)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mb-4">Sensível a estrutura da canópia e efeitos atmosféricos</p>
                  <div className="h-3 bg-slate-300 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-600" style={{ width: `${Math.min(((eviValue + 1) / 2) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-lg border-2 border-orange-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-900 text-lg">SAVI</h4>
                    <Badge className="bg-orange-100 text-orange-800 text-xs font-semibold">🏜️ Solo</Badge>
                  </div>
                  <p className="text-5xl font-bold text-orange-600 mb-2">{safeToFixed(saviValue, 3)}</p>
                  <p className="text-xs text-slate-600 mb-4 font-medium">Índice Ajustado ao Solo</p>
                  <div className="grid grid-cols-2 gap-2 text-center mb-4">
                    <div className="bg-white p-2 rounded border border-orange-100">
                      <p className="text-xs text-slate-500">VALOR</p>
                      <p className="text-sm font-bold text-slate-900">{safeToFixed(saviValue, 2)}</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-orange-100">
                      <p className="text-xs text-slate-500">σ</p>
                      <p className="text-sm font-bold text-slate-900">{safeToFixed(spectralAnalysis?.savi?.std, 2)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mb-4">Minimiza efeitos do solo nu</p>
                  <div className="h-3 bg-slate-300 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-400 to-amber-600" style={{ width: `${Math.min(((saviValue + 1) / 2) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TEMPORAL TRENDS */}
        {temporalAnalysis && areaClassification.isAgricultural && (
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="h-6 w-6" />
                  <div>
                    <CardTitle className="text-xl">Tendências Temporais</CardTitle>
                    <CardDescription className="text-purple-100">Evolução da sua fazenda</CardDescription>
                  </div>
                </div>
                {getTrendIcon(temporalAnalysis.trend.direction)}
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-500 font-medium mb-2">DIREÇÃO</p>
                  <p className="text-2xl font-bold">
                    {temporalAnalysis.trend.direction === "improving" && "📈"}
                    {temporalAnalysis.trend.direction === "declining" && "📉"}
                    {temporalAnalysis.trend.direction === "stable" && "➡️"}
                  </p>
                </div>
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-500 font-medium mb-2">MAGNITUDE</p>
                  <p className="text-2xl font-bold">{safeToFixed(temporalAnalysis.trend.magnitude, 2)}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-500 font-medium mb-2">PADRÃO</p>
                  <p className="text-2xl font-bold">{temporalAnalysis.seasonalPattern}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PREDICTIONS */}
        {predictions && areaClassification.isAgricultural && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6" />
                  <div>
                    <CardTitle className="text-xl">Previsões (30 dias)</CardTitle>
                    <CardDescription className="text-indigo-100">Próximos 30 dias</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {predictions.predictions.map((prediction, index) => (
                    <li key={index} className="flex gap-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <p className="text-sm text-slate-700">{prediction}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6" />
                  <div>
                    <CardTitle className="text-xl">Recomendações</CardTitle>
                    <CardDescription className="text-green-100">Ações prioritárias</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {predictions.recommendations.map((rec, index) => (
                    <li key={index} className="flex gap-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                        ✓
                      </div>
                      <p className="text-sm text-slate-700">{rec}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* NEXT ANALYSIS */}
        {predictions?.nextAnalysisDate && areaClassification.isAgricultural && (
          <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-white">
                <div className="flex items-center gap-4">
                  <Calendar className="h-10 w-10 text-cyan-100" />
                  <div>
                    <p className="text-sm font-semibold text-cyan-100">PRÓXIMA ANÁLISE</p>
                    <p className="text-2xl font-bold">
                      {new Date(predictions.nextAnalysisDate).toLocaleDateString("pt-BR", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="border-white/40 bg-white/20 text-white hover:bg-white/30">
                  <Clock className="h-4 w-4 mr-2" />
                  Agendar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TABS */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <Tabs defaultValue="relatorio" className="w-full">
            <TabsList className="w-full justify-start bg-slate-100 border-b rounded-none p-0 h-auto">
              <TabsTrigger value="relatorio" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600">
                <Brain className="h-4 w-4 mr-2" />
                Relatório
              </TabsTrigger>
              <TabsTrigger value="imagens" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600">
                <Camera className="h-4 w-4 mr-2" />
                Imagens
              </TabsTrigger>
              <TabsTrigger value="dados" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dados
              </TabsTrigger>
              <TabsTrigger value="visual" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600">
                <Eye className="h-4 w-4 mr-2" />
                Padrões
              </TabsTrigger>
              <TabsTrigger value="monitoramento" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600">
                <Activity className="h-4 w-4 mr-2" />
                Monitor
              </TabsTrigger>
              <TabsTrigger value="historico" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600">
                <Clock className="h-4 w-4 mr-2" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="relatorio" className="p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Análise por IA</h3>
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <div className="whitespace-pre-wrap text-slate-700 text-sm leading-relaxed">{interpretation}</div>
              </div>
            </TabsContent>

            <TabsContent value="imagens" className="p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Imagens de Satélite</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { src: images?.rgb, label: "📸 RGB", desc: "Imagem real" },
                  { src: images?.ndvi, label: "🌱 NDVI", desc: "Saúde" },
                  { src: images?.evi, label: "🔍 EVI", desc: "Aprimorado" },
                  { src: images?.savi, label: "🌍 SAVI", desc: "Solo-Veg" },
                  { src: images?.urban, label: "🏘️ Urbano", desc: "Detecção" },
                ].map((img, idx) => (
                  <Card key={idx} className="border-0 shadow-lg overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{img.label}</CardTitle>
                      <CardDescription>{img.desc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-200">
                        {img.src && typeof img.src === "string" && img.src.trim() !== "" ? (
                          <Image src={img.src} alt={img.label} fill className="object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full bg-slate-100 text-slate-400">
                            <Camera className="h-12 w-12 mb-2" />
                            <p className="text-xs">N/A</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="dados" className="p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Dados Detalhados</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Cobertura</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: "🌱 Vegetação", v: spectralAnalysis?.landCover?.vegetation, c: "emerald" },
                      { label: "🏘️ Urbana", v: spectralAnalysis?.landCover?.urban, c: "red" },
                      { label: "🏜️ Solo", v: spectralAnalysis?.landCover?.bareSoil, c: "amber" },
                      { label: "🌊 Água", v: spectralAnalysis?.landCover?.water, c: "blue" },
                    ].map((i, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{i.label}</span>
                          <Badge>{safeToFixed(i.v, 1)}%</Badge>
                        </div>
                        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full bg-${i.c}-600`} style={{ width: `${i.v}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Índices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <p className="text-xs text-slate-500">NDVI Mín</p>
                        <p className="text-lg font-bold">{safeToFixed(spectralAnalysis?.ndvi?.min, 3)}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <p className="text-xs text-slate-500">NDVI Máx</p>
                        <p className="text-lg font-bold">{safeToFixed(spectralAnalysis?.ndvi?.max, 3)}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <p className="text-xs text-slate-500">Confiança</p>
                        <p className="text-lg font-bold">{safeToFixed(areaClassification.confidence * 100, 0)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="visual" className="p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Padrões Visuais</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Detectados</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { l: "Geométricos", v: (patterns as any)?.geometricPatterns },
                      { l: "Bordas", v: (patterns as any)?.edgeDetection },
                      { l: "Cor", v: (patterns as any)?.colorVariation },
                    ].map((i, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{i.l}</span>
                          <span className="text-sm font-bold">{safeToFixed(i.v, 1)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-400 to-pink-600" style={{ width: `${i.v}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Pontuações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <p className="font-medium text-red-900">🏘️ Urbana: {areaClassification?.scores?.urban || 0}/100</p>
                      <div className="mt-2 h-2 bg-red-200 rounded-full overflow-hidden">
                        <div className="h-full bg-red-600" style={{ width: `${areaClassification?.scores?.urban || 0}%` }} />
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="font-medium text-green-900">🌾 Rural: {areaClassification?.scores?.rural || 0}/100</p>
                      <div className="mt-2 h-2 bg-green-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-600" style={{ width: `${areaClassification?.scores?.rural || 0}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="monitoramento" className="p-8">
              {areaClassification.isAgricultural && predictions?.monitoringPlan ? (
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Plano de Monitoramento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="bg-indigo-50">
                        <CardTitle>Frequência</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <p className="text-2xl font-bold text-indigo-600">{predictions.monitoringPlan.frequency}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="bg-green-50">
                        <CardTitle>Parâmetros</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-2">
                        {predictions.monitoringPlan.parameters.map((p: string, i: number) => (
                          <Badge key={i} className="bg-green-100 text-green-800">
                            {p}
                          </Badge>
                        ))}
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="bg-red-50">
                        <CardTitle>Alertas</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <p className="text-2xl font-bold text-red-600">{predictions.monitoringPlan.alerts.length}</p>
                      </CardContent>
                    </Card>
                  </div>
                  {predictions.monitoringPlan.alerts.length > 0 && (
                    <div className="space-y-2">
                      {predictions.monitoringPlan.alerts.map((a: string, i: number) => (
                        <Alert key={i} variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{a}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-500">Não disponível</h3>
                </div>
              )}
            </TabsContent>

            <TabsContent value="historico" className="p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Histórico</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-blue-50">
                    <CardTitle>Informações</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">ID:</span>
                      <code className="bg-slate-100 px-2 py-1 rounded text-xs">{data.analysisId || "N/A"}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Data:</span>
                      <span>{new Date(data.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Versão:</span>
                      <span>{metadata.analysisVersion}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-orange-50">
                    <CardTitle>Localização</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Latitude:</span>
                      <span className="font-mono">{safeToFixed(data.location.lat, 6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Longitude:</span>
                      <span className="font-mono">{safeToFixed(data.location.lng, 6)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
