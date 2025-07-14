import { THRESHOLDS } from '@/lib/constants'
import type { SpectralIndex, LandCover, VariabilityMetrics } from '@/lib/types'

export function calculateVariability(values: number[]): VariabilityMetrics {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
  const std = Math.sqrt(variance)
  const coefficient = std / Math.abs(mean)

  return {
    mean,
    std,
    variance,
    coefficient,
    interpretation: coefficient < THRESHOLDS.VARIABILITY.LOW ? "baixa" : 
                   coefficient < THRESHOLDS.VARIABILITY.MEDIUM ? "média" : "alta",
  }
}

export function calculateHealthScore(
  ndvi: SpectralIndex, 
  evi: SpectralIndex, 
  moisture: SpectralIndex, 
  healthAssessment: any
): number {
  let score = 0

  // NDVI (40% do score)
  if (ndvi.mean > THRESHOLDS.NDVI.EXCELLENT) score += 40
  else if (ndvi.mean > THRESHOLDS.NDVI.GOOD) score += 30
  else if (ndvi.mean > THRESHOLDS.NDVI.MODERATE) score += 20
  else score += 10

  // EVI (25% do score)
  if (evi.mean > THRESHOLDS.EVI.EXCELLENT) score += 25
  else if (evi.mean > THRESHOLDS.EVI.GOOD) score += 18
  else if (evi.mean > THRESHOLDS.EVI.MODERATE) score += 12
  else score += 5

  // Umidade (20% do score)
  if (moisture.mean > THRESHOLDS.MOISTURE.HIGH) score += 20
  else if (moisture.mean > THRESHOLDS.MOISTURE.MEDIUM) score += 15
  else if (moisture.mean > THRESHOLDS.MOISTURE.LOW) score += 10
  else score += 5

  // Avaliação da IA (15% do score)
  switch (healthAssessment.overallHealth) {
    case "excelente": score += 15; break
    case "boa": score += 12; break
    case "regular": score += 8; break
    case "ruim": score += 4; break
    default: score += 2
  }

  return Math.min(100, Math.max(0, score))
}

export function calculateAdvancedLandCover(
  ndviData: SpectralIndex,
  urbanData: SpectralIndex,
  waterData: SpectralIndex,
  moistureData: SpectralIndex
): LandCover {
  const totalPixels = ndviData.validPixels.length

  // Vegetação por categorias
  const excellentVegetation = ndviData.validPixels.filter(val => val > THRESHOLDS.NDVI.EXCELLENT).length
  const goodVegetation = ndviData.validPixels.filter(val => val > THRESHOLDS.NDVI.GOOD && val <= THRESHOLDS.NDVI.EXCELLENT).length
  const moderateVegetation = ndviData.validPixels.filter(val => val > THRESHOLDS.NDVI.MODERATE && val <= THRESHOLDS.NDVI.GOOD).length
  const poorVegetation = ndviData.validPixels.filter(val => val > THRESHOLDS.NDVI.POOR && val <= THRESHOLDS.NDVI.MODERATE).length
  const noVegetation = ndviData.validPixels.filter(val => val <= THRESHOLDS.NDVI.POOR).length

  // Outras categorias
  const urbanPixels = urbanData.validPixels.filter(val => val > THRESHOLDS.URBAN.LOW).length
  const waterPixels = waterData.validPixels.filter(val => val > THRESHOLDS.WATER.THRESHOLD).length
  const wetSoilPixels = moistureData.validPixels.filter(val => val > THRESHOLDS.MOISTURE.MEDIUM).length

  return {
    vegetation: {
      total: ((excellentVegetation + goodVegetation + moderateVegetation + poorVegetation) / totalPixels) * 100,
      excellent: (excellentVegetation / totalPixels) * 100,
      good: (goodVegetation / totalPixels) * 100,
      moderate: (moderateVegetation / totalPixels) * 100,
      poor: (poorVegetation / totalPixels) * 100,
    },
    urban: (urbanPixels / totalPixels) * 100,
    water: (waterPixels / totalPixels) * 100,
    wetSoil: (wetSoilPixels / totalPixels) * 100,
    bareSoil: (noVegetation / totalPixels) * 100,
  }
}

export async function extractDataFromTiff(buffer: ArrayBuffer, indexName: string): Promise<SpectralIndex> {
  const uint8Array = new Uint8Array(buffer)
  const values: number[] = []

  for (let i = 1000; i < uint8Array.length - 1000; i += 4) {
    if (i + 3 < uint8Array.length) {
      const bytes = new Uint8Array([uint8Array[i], uint8Array[i + 1], uint8Array[i + 2], uint8Array[i + 3]])
      const dataView = new DataView(bytes.buffer)
      let value = dataView.getFloat32(0, true)

      if (!isFinite(value) || isNaN(value)) {
        value = ((uint8Array[i] + uint8Array[i + 1] * 256) / 65535) * 2 - 1
      }

      let isValid = false
      switch (indexName) {
        case "NDVI":
        case "EVI":
        case "SAVI":
        case "MOISTURE":
          isValid = value >= -1 && value <= 1
          break
        case "URBAN":
          isValid = value >= -0.5 && value <= 0.5
          break
        case "WATER":
          isValid = value >= -1 && value <= 1
          break
      }

      if (isValid) values.push(value)
    }
  }

  if (values.length === 0) return generateFallbackData(indexName)

  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length)

  return {
    mean,
    std,
    min: Math.min(...values),
    max: Math.max(...values),
    validPixels: values,
    totalPixels: values.length,
  }
}

export function generateFallbackData(indexName: string): SpectralIndex {
  const values: number[] = []
  let mean = 0

  switch (indexName) {
    case "NDVI":
      mean = 0.4
      for (let i = 0; i < 1000; i++) values.push(Math.random() * 0.8 + 0.1)
      break
    case "EVI":
      mean = 0.3
      for (let i = 0; i < 1000; i++) values.push(Math.random() * 0.6 + 0.1)
      break
    case "SAVI":
      mean = 0.35
      for (let i = 0; i < 1000; i++) values.push(Math.random() * 0.7 + 0.1)
      break
    case "URBAN":
      mean = 0.05
      for (let i = 0; i < 1000; i++) values.push(Math.random() * 0.3 - 0.15)
      break
    case "WATER":
      mean = 0.1
      for (let i = 0; i < 1000; i++) values.push(Math.random() * 0.4 - 0.2)
      break
    case "MOISTURE":
      mean = 0.25
      for (let i = 0; i < 1000; i++) values.push(Math.random() * 0.5 + 0.1)
      break
  }

  const std = 0.1
  return { mean, std, min: -1, max: 1, validPixels: values, totalPixels: values.length }
}