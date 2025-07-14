import { CLASSIFICATION_TYPES } from '@/lib/constants'

export function getClassificationDescription(classification: string): string {
  const descriptions: { [key: string]: string } = {
    [CLASSIFICATION_TYPES.URBAN_DENSE]: "CIDADE DENSA - Área urbana com muitas construções",
    [CLASSIFICATION_TYPES.URBAN_MIXED]: "CIDADE MISTA - Área urbana com algumas áreas verdes",
    [CLASSIFICATION_TYPES.AGRICULTURAL_EXCELLENT]: "FAZENDA EXCELENTE - Vegetação muito saudável",
    [CLASSIFICATION_TYPES.AGRICULTURAL_HEALTHY]: "FAZENDA SAUDÁVEL - Boa vegetação",
    [CLASSIFICATION_TYPES.AGRICULTURAL_MODERATE]: "FAZENDA MODERADA - Vegetação regular",
    [CLASSIFICATION_TYPES.AGRICULTURAL_POOR]: "FAZENDA PROBLEMÁTICA - Vegetação com problemas",
    [CLASSIFICATION_TYPES.WATER_BODY]: "CORPO D'ÁGUA - Rio, lago ou represa",
    [CLASSIFICATION_TYPES.MIXED_AREA]: "ÁREA MISTA - Combinação de usos",
  }
  return descriptions[classification] || "Área indefinida"
}

export function getClassificationMessage(classification: string, isUrban: boolean): string {
  if (isUrban) return "🏘️ ÁREA URBANA DETECTADA - Não é fazenda!"
  if (classification === CLASSIFICATION_TYPES.AGRICULTURAL_EXCELLENT) return "🌟 FAZENDA SAUDÁVEL - Parabéns!"
  if (classification.includes("agricultural")) return "🌱 FAZENDA DETECTADA - Precisa cuidados"
  if (classification === CLASSIFICATION_TYPES.WATER_BODY) return "🌊 ÁREA DE ÁGUA - Rio, lago ou represa"
  if (classification === "bare_soil") return "🏜️ SOLO EXPOSTO - Área sem plantação"
  return "❓ ÁREA MISTA - Difícil classificar"
}

export function getClassificationColor(classification: string): string {
  if (classification.includes("urban")) return "bg-red-500"
  if (classification === CLASSIFICATION_TYPES.AGRICULTURAL_EXCELLENT) return "bg-green-500"
  if (classification.includes("agricultural")) return "bg-yellow-500"
  return "bg-gray-500"
}