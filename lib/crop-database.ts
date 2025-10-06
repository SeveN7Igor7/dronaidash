// Biblioteca de Culturas Brasileiras com Características Espectrais

export interface CropCharacteristics {
  name: string
  scientificName: string
  category: "grain" | "fruit" | "vegetable" | "fiber" | "sugarcane" | "pasture" | "forestry" | "coffee"
  growthCycle: number // dias
  spectralSignature: {
    ndviRange: { min: number; max: number; optimal: number }
    eviRange: { min: number; max: number; optimal: number }
    saviRange: { min: number; max: number; optimal: number }
  }
  growthStages: {
    name: string
    durationDays: number
    ndviExpected: number
    eviExpected: number
    characteristics: string[]
  }[]
  optimalConditions: {
    temperature: { min: number; max: number }
    rainfall: { min: number; max: number } // mm/ano
    soilType: string[]
    altitude: { min: number; max: number } // metros
  }
  visualCharacteristics: {
    plantingPattern: string[]
    rowSpacing: string
    canopyStructure: string
    seasonality: string
  }
  commonIssues: string[]
  harvestSeason: string[]
  mainRegions: string[]
}

export const BRAZILIAN_CROPS: Record<string, CropCharacteristics> = {
  soja: {
    name: "Soja",
    scientificName: "Glycine max",
    category: "grain",
    growthCycle: 120,
    spectralSignature: {
      ndviRange: { min: 0.3, max: 0.85, optimal: 0.7 },
      eviRange: { min: 0.25, max: 0.75, optimal: 0.55 },
      saviRange: { min: 0.25, max: 0.65, optimal: 0.5 },
    },
    growthStages: [
      {
        name: "Emergência",
        durationDays: 10,
        ndviExpected: 0.2,
        eviExpected: 0.15,
        characteristics: ["Solo visível", "Plântulas emergindo", "Cobertura mínima"],
      },
      {
        name: "Crescimento Vegetativo",
        durationDays: 40,
        ndviExpected: 0.5,
        eviExpected: 0.4,
        characteristics: ["Crescimento rápido", "Fechamento de entrelinhas", "Verde intenso"],
      },
      {
        name: "Floração",
        durationDays: 25,
        ndviExpected: 0.75,
        eviExpected: 0.6,
        characteristics: ["Cobertura máxima", "Flores brancas/roxas", "Vigor máximo"],
      },
      {
        name: "Enchimento de Grãos",
        durationDays: 30,
        ndviExpected: 0.7,
        eviExpected: 0.55,
        characteristics: ["Manutenção de vigor", "Formação de vagens", "Verde mantido"],
      },
      {
        name: "Maturação",
        durationDays: 15,
        ndviExpected: 0.35,
        eviExpected: 0.25,
        characteristics: ["Amarelecimento", "Perda de folhas", "Secamento"],
      },
    ],
    optimalConditions: {
      temperature: { min: 20, max: 30 },
      rainfall: { min: 450, max: 800 },
      soilType: ["Latossolo", "Argissolo", "Neossolo"],
      altitude: { min: 0, max: 1000 },
    },
    visualCharacteristics: {
      plantingPattern: ["Fileiras paralelas", "Espaçamento regular"],
      rowSpacing: "45-50 cm",
      canopyStructure: "Dossel fechado e uniforme",
      seasonality: "Plantio outubro-dezembro, colheita fevereiro-maio",
    },
    commonIssues: [
      "Ferrugem asiática",
      "Déficit hídrico",
      "Pragas (lagartas, percevejos)",
      "Doenças foliares",
      "Nematoides",
    ],
    harvestSeason: ["Fevereiro", "Março", "Abril", "Maio"],
    mainRegions: ["MT", "PR", "RS", "GO", "MS", "BA", "MG"],
  },

  milho: {
    name: "Milho",
    scientificName: "Zea mays",
    category: "grain",
    growthCycle: 140,
    spectralSignature: {
      ndviRange: { min: 0.3, max: 0.9, optimal: 0.75 },
      eviRange: { min: 0.3, max: 0.8, optimal: 0.65 },
      saviRange: { min: 0.3, max: 0.7, optimal: 0.55 },
    },
    growthStages: [
      {
        name: "Emergência",
        durationDays: 10,
        ndviExpected: 0.25,
        eviExpected: 0.2,
        characteristics: ["Solo exposto predominante", "Plântulas verticais", "Linhas visíveis"],
      },
      {
        name: "Desenvolvimento Vegetativo",
        durationDays: 50,
        ndviExpected: 0.6,
        eviExpected: 0.5,
        characteristics: ["Crescimento vertical rápido", "Verde intenso", "Estrutura em fileiras clara"],
      },
      {
        name: "Florescimento",
        durationDays: 20,
        ndviExpected: 0.8,
        eviExpected: 0.7,
        characteristics: ["Altura máxima", "Pendão visível", "Cobertura quase total"],
      },
      {
        name: "Enchimento de Grãos",
        durationDays: 40,
        ndviExpected: 0.75,
        eviExpected: 0.65,
        characteristics: ["Espigas formadas", "Verde mantido", "Alta biomassa"],
      },
      {
        name: "Maturação",
        durationDays: 20,
        ndviExpected: 0.4,
        eviExpected: 0.3,
        characteristics: ["Amarelecimento", "Secamento", "Espigas pendentes"],
      },
    ],
    optimalConditions: {
      temperature: { min: 18, max: 32 },
      rainfall: { min: 400, max: 800 },
      soilType: ["Latossolo", "Argissolo", "Nitossolo"],
      altitude: { min: 0, max: 2500 },
    },
    visualCharacteristics: {
      plantingPattern: ["Fileiras paralelas bem definidas", "Padrão linear forte"],
      rowSpacing: "70-90 cm",
      canopyStructure: "Vertical com folhas arqueadas",
      seasonality: "Safra: set-jan, Safrinha: jan-abr",
    },
    commonIssues: [
      "Cigarrinha",
      "Lagarta-do-cartucho",
      "Deficiência hídrica",
      "Doenças foliares",
      "Acamamento",
    ],
    harvestSeason: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho"],
    mainRegions: ["MT", "PR", "GO", "MS", "MG", "RS"],
  },

  canaDeAcucar: {
    name: "Cana-de-açúcar",
    scientificName: "Saccharum officinarum",
    category: "sugarcane",
    growthCycle: 365,
    spectralSignature: {
      ndviRange: { min: 0.4, max: 0.85, optimal: 0.7 },
      eviRange: { min: 0.35, max: 0.75, optimal: 0.6 },
      saviRange: { min: 0.3, max: 0.65, optimal: 0.52 },
    },
    growthStages: [
      {
        name: "Brotação",
        durationDays: 30,
        ndviExpected: 0.3,
        eviExpected: 0.25,
        characteristics: ["Sulcos visíveis", "Brotos emergindo", "Solo parcialmente exposto"],
      },
      {
        name: "Perfilhamento",
        durationDays: 60,
        ndviExpected: 0.55,
        eviExpected: 0.45,
        characteristics: ["Múltiplos colmos", "Crescimento lateral", "Verde médio"],
      },
      {
        name: "Crescimento Intenso",
        durationDays: 180,
        ndviExpected: 0.75,
        eviExpected: 0.65,
        characteristics: ["Altura máxima", "Fechamento completo", "Verde intenso"],
      },
      {
        name: "Maturação",
        durationDays: 95,
        ndviExpected: 0.65,
        eviExpected: 0.55,
        characteristics: ["Acúmulo de sacarose", "Leve amarelecimento", "Manutenção de biomassa"],
      },
    ],
    optimalConditions: {
      temperature: { min: 20, max: 35 },
      rainfall: { min: 1200, max: 1800 },
      soilType: ["Latossolo Roxo", "Terra Roxa", "Argissolo"],
      altitude: { min: 0, max: 1000 },
    },
    visualCharacteristics: {
      plantingPattern: ["Linhas paralelas em sulcos", "Padrão muito regular"],
      rowSpacing: "1.4-1.5 m",
      canopyStructure: "Vertical alto com folhas longas",
      seasonality: "Colheita: abril-novembro",
    },
    commonIssues: [
      "Broca-da-cana",
      "Cigarrinha",
      "Ferrugem",
      "Déficit hídrico",
      "Compactação do solo",
    ],
    harvestSeason: ["Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro"],
    mainRegions: ["SP", "GO", "MG", "PR", "MS", "AL", "PE"],
  },

  cafe: {
    name: "Café",
    scientificName: "Coffea arabica / Coffea canephora",
    category: "coffee",
    growthCycle: 365,
    spectralSignature: {
      ndviRange: { min: 0.5, max: 0.8, optimal: 0.68 },
      eviRange: { min: 0.4, max: 0.7, optimal: 0.58 },
      saviRange: { min: 0.35, max: 0.6, optimal: 0.5 },
    },
    growthStages: [
      {
        name: "Repouso Vegetativo",
        durationDays: 60,
        ndviExpected: 0.6,
        eviExpected: 0.5,
        characteristics: ["Crescimento reduzido", "Verde constante", "Cultura perene estável"],
      },
      {
        name: "Floração",
        durationDays: 15,
        ndviExpected: 0.65,
        eviExpected: 0.55,
        characteristics: ["Flores brancas visíveis", "Reflexão alterada", "Perfume característico"],
      },
      {
        name: "Granação",
        durationDays: 180,
        ndviExpected: 0.7,
        eviExpected: 0.6,
        characteristics: ["Formação de frutos", "Verde intenso", "Alta atividade fotossintética"],
      },
      {
        name: "Maturação",
        durationDays: 110,
        ndviExpected: 0.65,
        eviExpected: 0.55,
        characteristics: ["Frutos mudando de cor", "Verde a vermelho/amarelo", "Redução de vigor"],
      },
    ],
    optimalConditions: {
      temperature: { min: 18, max: 24 },
      rainfall: { min: 1200, max: 1800 },
      soilType: ["Latossolo Vermelho", "Argissolo", "Solo profundo e bem drenado"],
      altitude: { min: 600, max: 1200 },
    },
    visualCharacteristics: {
      plantingPattern: ["Fileiras em curvas de nível", "Padrão regular adaptado ao terreno"],
      rowSpacing: "3-4 m entre linhas",
      canopyStructure: "Arbustivo denso, perene",
      seasonality: "Colheita: maio-setembro",
    },
    commonIssues: [
      "Ferrugem do cafeeiro",
      "Broca-do-café",
      "Bicho-mineiro",
      "Déficit hídrico",
      "Cercosporiose",
    ],
    harvestSeason: ["Maio", "Junho", "Julho", "Agosto", "Setembro"],
    mainRegions: ["MG", "ES", "SP", "BA", "PR", "RO"],
  },

  algodao: {
    name: "Algodão",
    scientificName: "Gossypium hirsutum",
    category: "fiber",
    growthCycle: 180,
    spectralSignature: {
      ndviRange: { min: 0.3, max: 0.8, optimal: 0.65 },
      eviRange: { min: 0.25, max: 0.7, optimal: 0.55 },
      saviRange: { min: 0.25, max: 0.6, optimal: 0.48 },
    },
    growthStages: [
      {
        name: "Emergência",
        durationDays: 15,
        ndviExpected: 0.25,
        eviExpected: 0.2,
        characteristics: ["Solo predominante", "Plântulas pequenas", "Cobertura mínima"],
      },
      {
        name: "Crescimento Vegetativo",
        durationDays: 60,
        ndviExpected: 0.6,
        eviExpected: 0.5,
        characteristics: ["Desenvolvimento de ramos", "Verde intenso", "Fechamento gradual"],
      },
      {
        name: "Floração",
        durationDays: 40,
        ndviExpected: 0.75,
        eviExpected: 0.65,
        characteristics: ["Flores brancas/amarelas", "Cobertura máxima", "Alto vigor"],
      },
      {
        name: "Frutificação",
        durationDays: 45,
        ndviExpected: 0.7,
        eviExpected: 0.6,
        characteristics: ["Formação de capulhos", "Verde mantido", "Estrutura pesada"],
      },
      {
        name: "Abertura de Capulhos",
        durationDays: 20,
        ndviExpected: 0.4,
        eviExpected: 0.3,
        characteristics: ["Algodão branco visível", "Desfolha", "Preparo para colheita"],
      },
    ],
    optimalConditions: {
      temperature: { min: 20, max: 30 },
      rainfall: { min: 500, max: 1500 },
      soilType: ["Latossolo", "Argissolo", "Solo profundo"],
      altitude: { min: 0, max: 1000 },
    },
    visualCharacteristics: {
      plantingPattern: ["Fileiras regulares", "Espaçamento amplo"],
      rowSpacing: "76-90 cm",
      canopyStructure: "Arbustivo com ramificações",
      seasonality: "Plantio: out-dez, Colheita: jun-set",
    },
    commonIssues: [
      "Bicudo-do-algodoeiro",
      "Lagarta-rosada",
      "Doenças fúngicas",
      "Déficit hídrico",
      "Ramularia",
    ],
    harvestSeason: ["Junho", "Julho", "Agosto", "Setembro"],
    mainRegions: ["MT", "BA", "MS", "GO", "MA"],
  },

  pastagem: {
    name: "Pastagem",
    scientificName: "Brachiaria / Panicum / Cynodon",
    category: "pasture",
    growthCycle: 365,
    spectralSignature: {
      ndviRange: { min: 0.2, max: 0.75, optimal: 0.55 },
      eviRange: { min: 0.15, max: 0.65, optimal: 0.45 },
      saviRange: { min: 0.15, max: 0.55, optimal: 0.4 },
    },
    growthStages: [
      {
        name: "Rebrota Inicial",
        durationDays: 15,
        ndviExpected: 0.35,
        eviExpected: 0.28,
        characteristics: ["Após pastejo", "Solo parcialmente visível", "Verde claro"],
      },
      {
        name: "Crescimento Ativo",
        durationDays: 30,
        ndviExpected: 0.6,
        eviExpected: 0.5,
        characteristics: ["Vigor alto", "Verde intenso", "Altura ideal para pastejo"],
      },
      {
        name: "Maturação",
        durationDays: 30,
        ndviExpected: 0.5,
        eviExpected: 0.42,
        characteristics: ["Redução de qualidade", "Florescimento", "Coloração mais clara"],
      },
      {
        name: "Senescência",
        durationDays: 60,
        ndviExpected: 0.3,
        eviExpected: 0.25,
        characteristics: ["Amarelecimento", "Material seco", "Baixo valor nutritivo"],
      },
    ],
    optimalConditions: {
      temperature: { min: 15, max: 35 },
      rainfall: { min: 800, max: 2000 },
      soilType: ["Diversos", "Adapta-se bem"],
      altitude: { min: 0, max: 2000 },
    },
    visualCharacteristics: {
      plantingPattern: ["Cobertura contínua", "Sem padrão definido", "Irregular"],
      rowSpacing: "N/A - cobertura total",
      canopyStructure: "Baixo e denso",
      seasonality: "Perene com sazonalidade de crescimento",
    },
    commonIssues: [
      "Degradação",
      "Invasoras",
      "Cigarrinha-das-pastagens",
      "Superpastejo",
      "Erosão",
      "Compactação",
    ],
    harvestSeason: ["Pastejo rotativo o ano todo"],
    mainRegions: ["Todas as regiões"],
  },

  eucalipto: {
    name: "Eucalipto",
    scientificName: "Eucalyptus spp",
    category: "forestry",
    growthCycle: 2555, // 7 anos
    spectralSignature: {
      ndviRange: { min: 0.5, max: 0.85, optimal: 0.72 },
      eviRange: { min: 0.45, max: 0.75, optimal: 0.65 },
      saviRange: { min: 0.4, max: 0.68, optimal: 0.58 },
    },
    growthStages: [
      {
        name: "Estabelecimento",
        durationDays: 365,
        ndviExpected: 0.45,
        eviExpected: 0.38,
        characteristics: ["Plantas jovens", "Solo visível entre linhas", "Crescimento inicial"],
      },
      {
        name: "Crescimento Rápido",
        durationDays: 1095,
        ndviExpected: 0.7,
        eviExpected: 0.62,
        characteristics: ["Fechamento de copas", "Verde intenso constante", "Alto incremento"],
      },
      {
        name: "Maturação",
        durationDays: 1095,
        ndviExpected: 0.75,
        eviExpected: 0.68,
        characteristics: ["Estrutura estabilizada", "Cobertura total", "Porte adulto"],
      },
    ],
    optimalConditions: {
      temperature: { min: 15, max: 28 },
      rainfall: { min: 800, max: 1500 },
      soilType: ["Latossolo", "Argissolo", "Solos profundos"],
      altitude: { min: 0, max: 1000 },
    },
    visualCharacteristics: {
      plantingPattern: ["Linhas regulares", "Espaçamento 3x2m típico"],
      rowSpacing: "3 m",
      canopyStructure: "Alto, copas arredondadas, perene",
      seasonality: "Corte: 6-7 anos",
    },
    commonIssues: [
      "Formigas cortadeiras",
      "Deficiência nutricional",
      "Gonipterus (besouro)",
      "Déficit hídrico em fase jovem",
    ],
    harvestSeason: ["Ano todo (corte programado)"],
    mainRegions: ["MG", "SP", "PR", "BA", "MS", "RS"],
  },
}

// Função para identificar cultura baseada em características espectrais
export function identifyCropBySpectralData(
  ndvi: number,
  evi: number,
  savi: number,
  patterns?: {
    rowSpacing?: string
    uniformity?: string
    canopyHeight?: string
  },
): { crop: string; confidence: number; alternatives: string[] } {
  const scores: { crop: string; score: number }[] = []

  for (const [key, crop] of Object.entries(BRAZILIAN_CROPS)) {
    let score = 0

    // Análise espectral (peso 70%)
    const ndviMatch = isInRange(ndvi, crop.spectralSignature.ndviRange.min, crop.spectralSignature.ndviRange.max)
    const eviMatch = isInRange(evi, crop.spectralSignature.eviRange.min, crop.spectralSignature.eviRange.max)
    const saviMatch = isInRange(savi, crop.spectralSignature.saviRange.min, crop.spectralSignature.saviRange.max)

    if (ndviMatch) score += 25
    if (eviMatch) score += 25
    if (saviMatch) score += 20

    // Proximidade ao valor ótimo
    score += (1 - Math.abs(ndvi - crop.spectralSignature.ndviRange.optimal)) * 15
    score += (1 - Math.abs(evi - crop.spectralSignature.eviRange.optimal)) * 15

    scores.push({ crop: crop.name, score: Math.max(0, Math.min(100, score)) })
  }

  scores.sort((a, b) => b.score - a.score)

  const topMatch = scores[0]
  const alternatives = scores.slice(1, 4).map((s) => s.crop)

  return {
    crop: topMatch.crop,
    confidence: topMatch.score / 100,
    alternatives,
  }
}

function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

// Função para obter recomendações específicas por cultura
export function getCropRecommendations(cropName: string, healthScore: number): string[] {
  const crop = Object.values(BRAZILIAN_CROPS).find((c) => c.name === cropName)
  if (!crop) return []

  const recommendations: string[] = []

  if (healthScore < 0.5) {
    recommendations.push(`Atenção: Saúde da ${crop.name} está abaixo do ideal`)
    recommendations.push(`Verificar ocorrência de: ${crop.commonIssues.slice(0, 3).join(", ")}`)
  } else if (healthScore < 0.7) {
    recommendations.push(`${crop.name} em condições moderadas`)
    recommendations.push(`Monitorar: ${crop.commonIssues[0]}`)
  } else {
    recommendations.push(`${crop.name} em excelente condição`)
    recommendations.push(`Manter práticas atuais de manejo`)
  }

  recommendations.push(`Colheita prevista para: ${crop.harvestSeason.join(", ")}`)

  return recommendations
}
