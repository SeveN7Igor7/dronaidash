// Constantes da aplicação
export const API_ENDPOINTS = {
  GEOCODE: '/api/geocode',
  ANALYZE_FARM: '/api/analyze-farm',
} as const

export const SENTINEL_CONFIG = {
  CLIENT_ID: process.env.SENTINEL_CLIENT_ID || "1c1cf1fc-382f-499e-ab62-0fdc055f9858",
  CLIENT_SECRET: process.env.SENTINEL_CLIENT_SECRET || "0G2AL9MAK5RMTbOaNSuEPWigdfn1IeYb",
  TOKEN_URL: "https://services.sentinel-hub.com/oauth/token",
  PROCESS_URL: "https://services.sentinel-hub.com/api/v1/process",
} as const

export const GEMINI_CONFIG = {
  API_KEY: process.env.GEMINI_API_KEY || "AIzaSyBCOv7eXRZ4XIz47aJAF92Y1F4MDLKDv5M",
  BASE_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
} as const

export const EXTERNAL_APIS = {
  INVERTEXTO: {
    TOKEN: "20193|uBrkjYHKhh6hmPLivBR8H3ZUZ9K78U7H",
    BASE_URL: "https://api.invertexto.com/v1/cep",
  },
  VIACEP: {
    BASE_URL: "https://viacep.com.br/ws",
  },
  NOMINATIM: {
    BASE_URL: "https://nominatim.openstreetmap.org/search",
  },
} as const

export const IMAGE_CONFIG = {
  WIDTH: 512,
  HEIGHT: 512,
  MAX_CLOUD_COVERAGE: 30,
  DAYS_BACK: 30,
} as const

export const CLASSIFICATION_TYPES = {
  URBAN_DENSE: 'urban_dense',
  URBAN_MIXED: 'urban_mixed',
  AGRICULTURAL_EXCELLENT: 'agricultural_excellent',
  AGRICULTURAL_HEALTHY: 'agricultural_healthy',
  AGRICULTURAL_MODERATE: 'agricultural_moderate',
  AGRICULTURAL_POOR: 'agricultural_poor',
  WATER_BODY: 'water_body',
  MIXED_AREA: 'mixed_area',
} as const

export const HEALTH_LEVELS = {
  EXCELLENT: 'excelente',
  GOOD: 'boa',
  REGULAR: 'regular',
  POOR: 'ruim',
  CRITICAL: 'crítica',
} as const

export const CROP_TYPES = [
  'soja',
  'milho',
  'cana-de-açúcar',
  'café',
  'algodão',
  'arroz',
  'feijão',
  'trigo',
  'pastagem',
  'eucalipto',
  'citros',
  'banana',
  'tomate',
  'batata',
  'hortaliças',
  'flores',
  'fruticultura',
] as const

export const GROWTH_STAGES = [
  'plantio',
  'crescimento',
  'floração',
  'colheita',
  'pousio',
] as const

export const TIMEOUTS = {
  API_REQUEST: 60000, // 60 segundos
  GEOCODE: 10000, // 10 segundos
  IMAGE_DOWNLOAD: 60000, // 60 segundos
} as const

export const THRESHOLDS = {
  NDVI: {
    EXCELLENT: 0.6,
    GOOD: 0.4,
    MODERATE: 0.2,
    POOR: 0.1,
  },
  EVI: {
    EXCELLENT: 0.4,
    GOOD: 0.2,
    MODERATE: 0.1,
  },
  MOISTURE: {
    HIGH: 0.3,
    MEDIUM: 0.2,
    LOW: 0.1,
  },
  URBAN: {
    HIGH: 0.3,
    MEDIUM: 0.15,
    LOW: 0.05,
  },
  WATER: {
    THRESHOLD: 0.3,
  },
  VARIABILITY: {
    LOW: 0.2,
    MEDIUM: 0.5,
  },
} as const