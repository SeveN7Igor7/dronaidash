// Tipos principais da aplicação
export interface Coordinates {
  lat: number
  lng: number
}

export interface CepData {
  cep: string
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  complemento: string
  ibge: string
}

export interface SpectralAnalysis {
  ndvi: SpectralIndex
  evi: SpectralIndex
  savi: SpectralIndex
  urban: SpectralIndex
  water: SpectralIndex
  moisture: SpectralIndex
  landCover: LandCover
  variability: Variability
  dominantLandUse: string
  qualityMetrics: QualityMetrics
}

export interface SpectralIndex {
  mean: number
  std: number
  min: number
  max: number
  validPixels: number[]
  totalPixels: number
}

export interface LandCover {
  vegetation: VegetationCover
  urban: number
  water: number
  wetSoil: number
  bareSoil: number
}

export interface VegetationCover {
  total: number
  excellent: number
  good: number
  moderate: number
  poor: number
}

export interface Variability {
  ndvi: VariabilityMetrics
  moisture: VariabilityMetrics
}

export interface VariabilityMetrics {
  mean: number
  std: number
  variance: number
  coefficient: number
  interpretation: string
}

export interface QualityMetrics {
  dataQuality: number
  spatialConsistency: number
  temporalStability: number
}

export interface AreaClassification {
  classification: string
  confidence: number
  description: string
  isAgricultural: boolean
  isUrban: boolean
  needsAttention: boolean
  healthScore: number
  issues: Issue[]
  cropType: string
  growthStage: string
  urbanizationLevel: number
  vegetationHealth: number
  moistureLevel: number
  variabilityIndex: number
  advancedMetrics: AdvancedMetrics
  returnPoints: ReturnPoints | null
  aiAnalysis: AIAnalysis
  spectralMetrics: SpectralMetrics
}

export interface Issue {
  type: string
  severity: 'low' | 'medium' | 'high'
  description: string
  recommendation: string
}

export interface AdvancedMetrics {
  productivityIndex: string
  stressIndex: string
  uniformityIndex: number
  sustainabilityScore: number
  riskAssessment: RiskFactor[]
}

export interface RiskFactor {
  type: string
  level: 'low' | 'medium' | 'high'
  description: string
}

export interface ReturnPoints {
  current: SpectralMetrics
  target: SpectralMetrics
  gaps: SpectralMetrics
  recommendations: string[]
}

export interface SpectralMetrics {
  ndvi: number
  evi: number
  savi?: number
  moisture: number
}

export interface AIAnalysis {
  classification: string
  reasoning: string
  details: string
  confidence: number
  cropIdentification: CropIdentification
  healthAssessment: HealthAssessment
  problemsDetected: string[]
  patterns: Patterns
  recommendations: string[]
}

export interface CropIdentification {
  primaryCrop: string
  secondaryCrop?: string
  confidence: number
  growthStage: string
  reasoning: string
}

export interface HealthAssessment {
  overallHealth: 'excelente' | 'boa' | 'regular' | 'ruim' | 'crítica'
  vegetationDensity: 'alta' | 'média' | 'baixa'
  colorPattern: string
  uniformity: 'uniforme' | 'irregular' | 'muito irregular'
}

export interface Patterns {
  fieldShape?: string
  plantingPattern?: string
  irrigationSigns?: boolean
  machineryMarks?: boolean
  geometricPatterns?: number
  edgeDetection?: number
  colorVariation?: number
}

export interface TemporalAnalysis {
  trend: {
    direction: 'improving' | 'declining' | 'stable'
    magnitude: number
    confidence: string
  }
  seasonalPattern: string
}

export interface Predictions {
  predictions: string[]
  recommendations: string[]
  nextAnalysisDate: string
  priority: 'low' | 'medium' | 'high'
  expectedYield: ExpectedYield
  riskFactors: RiskFactor[]
  monitoringPlan?: MonitoringPlan
}

export interface ExpectedYield {
  percentage: number
  confidence: number
  factors: {
    vegetation: number
    health: number
    issues: number
  }
}

export interface MonitoringPlan {
  frequency: string
  parameters: string[]
  alerts: string[]
  actions: string[]
  thresholds: {
    ndvi_min: number
    moisture_min: number
    variability_max: number
  }
  notifications: {
    email: boolean
    sms: boolean
    dashboard: boolean
  }
  reportSchedule: {
    weekly: boolean
    biweekly: boolean
    monthly: boolean
  }
}

export interface AnalysisImages {
  rgb: string
  ndvi: string
  evi: string
  savi: string
  urban: string
  moisture?: string
}

export interface AnalysisMetadata {
  bbox: number[]
  timeRange: {
    from: string
    to: string
  }
  processingDate: string
  analysisVersion: string
  confidence: number
  analysisMethod: string
  processingSteps: string[]
}

export interface AnalysisData {
  analysisId?: string
  spectralAnalysis: SpectralAnalysis
  areaClassification: AreaClassification
  temporalAnalysis?: TemporalAnalysis
  interpretation: string
  predictions?: Predictions
  images: AnalysisImages
  location: Coordinates
  metadata: AnalysisMetadata
  timestamp: string
}

export interface ApiError {
  error: string
  details?: string
}

export interface GeocodeResponse {
  lat: number
  lng: number
  address: string
  cep: string
  details: CepData
}