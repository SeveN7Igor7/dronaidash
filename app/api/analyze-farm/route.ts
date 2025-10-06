import { type NextRequest, NextResponse } from "next/server"
import { identifyCropBySpectralData, getCropRecommendations, BRAZILIAN_CROPS } from "@/lib/crop-database"

const CLIENT_ID = process.env.SENTINEL_CLIENT_ID || "88065105-d1fb-48df-a050-d92e770933a8"
const CLIENT_SECRET = process.env.SENTINEL_CLIENT_SECRET || "wyoU2BR5SaVfNoDJDAJZFev9jJeHF5nT"
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDg47oxwsRkQpOJaT_UwCoe5nS4JAFp3sE"

export async function POST(request: NextRequest) {
  try {
    const { coordinates, cep } = await request.json()

    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      return NextResponse.json({ error: "Coordenadas são obrigatórias" }, { status: 400 })
    }

    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log(`🔍 ANÁLISE COMPLETA INICIADA - ID: ${analysisId}`)
    console.log(`📍 Coordenadas: ${coordinates.lat}, ${coordinates.lng}`)

    const bbox = [coordinates.lng - 0.01, coordinates.lat - 0.01, coordinates.lng + 0.01, coordinates.lat + 0.01]

    console.log("🔑 Obtendo token Sentinel...")
    const token = await getSentinelToken()

    const timeRange = getDateRange(30)
    console.log(`📅 Período de análise: ${timeRange.from} até ${timeRange.to}`)

    // ETAPA 1: BAIXAR IMAGEM RGB PARA IA ANALISAR
    console.log("📡 ETAPA 1/6: Baixando imagem RGB para análise visual...")
    const rgbBuffer = await downloadSentinelImage(token, timeRange, bbox, EVALSCRIPT_TRUE_COLOR_HD, "image/jpeg")

    // ETAPA 2: ANÁLISE VISUAL COMPLETA COM IA
    console.log("🤖 ETAPA 2/6: Análise visual completa com IA...")
    const aiAnalysis = await performCompleteAIAnalysis(rgbBuffer, coordinates, GEMINI_API_KEY)

    // ETAPA 3: BAIXAR DADOS ESPECTRAIS
    console.log("📊 ETAPA 3/6: Baixando dados espectrais...")
    const [ndviBuffer, eviBuffer, saviBuffer, urbanBuffer, waterBuffer, moistureBuffer] = await Promise.all([
      downloadSentinelImage(token, timeRange, bbox, EVALSCRIPT_NDVI_REAL, "image/tiff"),
      downloadSentinelImage(token, timeRange, bbox, EVALSCRIPT_EVI_REAL, "image/tiff"),
      downloadSentinelImage(token, timeRange, bbox, EVALSCRIPT_SAVI_REAL, "image/tiff"),
      downloadSentinelImage(token, timeRange, bbox, EVALSCRIPT_URBAN_REAL, "image/tiff"),
      downloadSentinelImage(token, timeRange, bbox, EVALSCRIPT_WATER_REAL, "image/tiff"),
      downloadSentinelImage(token, timeRange, bbox, EVALSCRIPT_MOISTURE_REAL, "image/tiff"),
    ])

    // ETAPA 4: PROCESSAR DADOS ESPECTRAIS
    console.log("🔬 ETAPA 4/6: Processando dados espectrais...")
    const spectralAnalysis = await processAdvancedSpectralData({
      ndvi: ndviBuffer,
      evi: eviBuffer,
      savi: saviBuffer,
      urban: urbanBuffer,
      water: waterBuffer,
      moisture: moistureBuffer,
    })

    // ETAPA 5: CLASSIFICAÇÃO E DIAGNÓSTICO COMPLETO
    console.log("🎯 ETAPA 5/6: Classificação e diagnóstico completo...")
    const completeAnalysis = await performCompleteAnalysis(aiAnalysis, spectralAnalysis, coordinates)

    // ETAPA 6: BAIXAR IMAGENS VISUAIS E SALVAR HISTÓRICO
    console.log("📸 ETAPA 6/6: Gerando imagens visuais e salvando histórico...")
    const [ndviVisualBuffer, eviVisualBuffer, saviVisualBuffer, urbanVisualBuffer, moistureVisualBuffer] =
      await Promise.all([
        downloadSentinelImage(token, timeRange, bbox, EVALSCRIPT_NDVI_VISUAL, "image/jpeg"),
        downloadSentinelImage(token, timeRange, bbox, EVALSCRIPT_EVI_VISUAL, "image/jpeg"),
        downloadSentinelImage(token, timeRange, bbox, EVALSCRIPT_SAVI_VISUAL, "image/jpeg"),
        downloadSentinelImage(token, timeRange, bbox, EVALSCRIPT_URBAN_VISUAL, "image/jpeg"),
        downloadSentinelImage(token, timeRange, bbox, EVALSCRIPT_MOISTURE_VISUAL, "image/jpeg"),
      ])

    // LOGS DE DEBUG
    console.log("🖼️ Tamanhos dos buffers de imagem:")
    console.log(`RGB: ${rgbBuffer.byteLength} bytes`)
    console.log(`NDVI Visual: ${ndviVisualBuffer.byteLength} bytes`)
    console.log(`EVI Visual: ${eviVisualBuffer.byteLength} bytes`)
    console.log(`SAVI Visual: ${saviVisualBuffer.byteLength} bytes`)
    console.log(`Urban Visual: ${urbanVisualBuffer.byteLength} bytes`)
    console.log(`Moisture Visual: ${moistureVisualBuffer.byteLength} bytes`)

    // GERAR INTERPRETAÇÃO COMPLETA
    console.log("📝 Gerando interpretação completa...")
    const interpretation = await generateCompleteInterpretation(
      { ...spectralAnalysis, aiAnalysis },
      completeAnalysis,
      coordinates,
      GEMINI_API_KEY,
    )

    // GERAR PREVISÕES E MONITORAMENTO
    let predictions = null
    let monitoring = null
    if (completeAnalysis.isAgricultural) {
      console.log("🔮 Gerando previsões e plano de monitoramento...")
      predictions = await generateAdvancedPredictions(spectralAnalysis, completeAnalysis, aiAnalysis, GEMINI_API_KEY)
      monitoring = await generateMonitoringPlan(spectralAnalysis, completeAnalysis, aiAnalysis, GEMINI_API_KEY)
    }

    // PREPARAR IMAGENS COM TIMESTAMP
    const timestamp = new Date().toISOString()
    const images = {
      rgb: {
        data: `data:image/jpeg;base64,${Buffer.from(rgbBuffer).toString("base64")}`,
        timestamp,
        filename: `rgb_${analysisId}.jpg`,
      },
      ndvi: {
        data: `data:image/jpeg;base64,${Buffer.from(ndviVisualBuffer).toString("base64")}`,
        timestamp,
        filename: `ndvi_${analysisId}.jpg`,
      },
      evi: {
        data: `data:image/jpeg;base64,${Buffer.from(eviVisualBuffer).toString("base64")}`,
        timestamp,
        filename: `evi_${analysisId}.jpg`,
      },
      savi: {
        data: `data:image/jpeg;base64,${Buffer.from(saviVisualBuffer).toString("base64")}`,
        timestamp,
        filename: `savi_${analysisId}.jpg`,
      },
      urban: {
        data: `data:image/jpeg;base64,${Buffer.from(urbanVisualBuffer).toString("base64")}`,
        timestamp,
        filename: `urban_${analysisId}.jpg`,
      },
      moisture: {
        data: `data:image/jpeg;base64,${Buffer.from(moistureVisualBuffer).toString("base64")}`,
        timestamp,
        filename: `moisture_${analysisId}.jpg`,
      },
    }

    // ESTRUTURA SIMPLIFICADA PARA O FRONTEND
    const imageUrls = {
      rgb: images.rgb.data,
      ndvi: images.ndvi.data,
      evi: images.evi.data,
      savi: images.savi.data,
      urban: images.urban.data,
      moisture: images.moisture.data,
    }

    // SALVAR NO HISTÓRICO (simulado - em produção seria banco de dados)
    const historyEntry = {
      id: analysisId,
      timestamp,
      coordinates,
      cep,
      classification: completeAnalysis.classification,
      confidence: completeAnalysis.confidence,
      cropType: aiAnalysis.cropIdentification?.primaryCrop || "unknown",
      healthScore: completeAnalysis.healthScore,
      issues: completeAnalysis.issues,
      images: Object.keys(images),
    }

    console.log("💾 Salvando no histórico:", historyEntry)

    console.log("✅ ANÁLISE COMPLETA CONCLUÍDA!")

    return NextResponse.json({
      analysisId,
      spectralAnalysis: { ...spectralAnalysis, aiAnalysis },
      areaClassification: completeAnalysis,
      interpretation,
      predictions,
      monitoring,
      images: imageUrls, // <- MUDANÇA AQUI
      location: { lat: coordinates.lat, lng: coordinates.lng },
      metadata: {
        bbox,
        timeRange,
        processingDate: timestamp,
        analysisVersion: "9.0-complete-analysis",
        confidence: completeAnalysis.confidence,
        analysisMethod: "ai-visual + advanced-spectral + crop-identification",
        processingSteps: [
          "RGB image download",
          "AI visual analysis",
          "Spectral data extraction",
          "Advanced processing",
          "Complete classification",
          "Image generation",
        ],
      },
      history: historyEntry,
      timestamp,
    })
  } catch (error) {
    console.error("❌ Erro na análise completa:", error)
    return NextResponse.json(
      {
        error: "Erro na análise completa. Tente novamente.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

// ANÁLISE COMPLETA COM IA - INCLUINDO IDENTIFICAÇÃO DE PLANTAS
async function performCompleteAIAnalysis(rgbBuffer: ArrayBuffer, coordinates: any, apiKey: string) {
  console.log("🤖 Iniciando análise visual completa com IA...")

  if (!apiKey) {
    return getAIAnalysisFallback()
  }

  try {
    const base64Image = Buffer.from(rgbBuffer).toString("base64")

    const prompt = `
Você é um AGRÔNOMO ESPECIALISTA com 20+ anos de experiência em agricultura de precisão, sensoriamento remoto e análise de imagens de satélite.
Sua missão é fornecer uma análise PRECISA, DETALHADA e PROFISSIONAL desta imagem de satélite.

🌍 CONTEXTO:
Coordenadas: ${coordinates.lat}, ${coordinates.lng}
Esta é uma imagem de satélite Sentinel-2 em cor verdadeira (RGB).

📋 ANÁLISE DETALHADA REQUERIDA:

1️⃣ CLASSIFICAÇÃO DO USO DO SOLO:
   - Tipo: Área agrícola / Área urbana / Área de preservação / Água / Mista
   - Confiança: 0.0-1.0 (seja criterioso!)
   - Características observadas: lista específica do que você vê

2️⃣ IDENTIFICAÇÃO DE CULTURAS (se área agrícola):

   PRINCIPAIS CULTURAS DO BRASIL E SUAS CARACTERÍSTICAS:
   
   🌾 SOJA: 
   - Padrão: Fileiras regulares 45-50cm, verde uniforme intenso
   - Estágios: Emergência (solo exposto) → Vegetativo (verde crescente) → Floração (cobertura máxima, verde escuro) → Enchimento (verde mantido) → Maturação (amarelado/marrom)
   
   🌽 MILHO:
   - Padrão: Fileiras muito visíveis 70-90cm, estrutura vertical
   - Estágios: Emergência (linhas claras) → Vegetativo (crescimento rápido) → Floração (altura máxima, pendão) → Enchimento (verde mantido) → Maturação (amarelo/seco)
   
   🎋 CANA-DE-AÇÚCAR:
   - Padrão: Linhas largas 1.4-1.5m, plantio em sulcos, verde constante
   - Ciclo longo: Brotação → Perfilhamento → Crescimento → Maturação
   - Características: Uniforme, verde durante todo o ano, corte mecanizado visível
   
   ☕ CAFÉ:
   - Padrão: Fileiras em curvas de nível, arbustivo perene
   - Características: Verde constante, copas arredondadas, sombra entre linhas
   - Estágios: Repouso → Floração (branco) → Granação → Maturação (vermelho/amarelo)
   
   🌱 ALGODÃO:
   - Padrão: Fileiras regulares 76-90cm, arbustivo
   - Estágios: Emergência → Vegetativo → Floração (branco/amarelo) → Frutificação → Abertura (branco visível)
   
   🐄 PASTAGEM:
   - Padrão: Cobertura contínua sem linhas, irregular, variação de tons
   - Características: Verde heterogêneo, sem padrão de plantio, pode ter trilhas de gado
   
   🌳 EUCALIPTO:
   - Padrão: Linhas regulares 3x2m, copas circulares visíveis
   - Características: Verde escuro constante, sombra pronunciada, textura uniforme

3️⃣ ANÁLISE DE SAÚDE E VIGOR:
   - Estado geral: EXCELENTE (verde intenso, uniforme) / BOM / REGULAR / RUIM / CRÍTICO
   - Densidade vegetativa: ALTA (cobertura >80%) / MÉDIA (40-80%) / BAIXA (<40%)
   - Padrão de cor: verde intenso / verde normal / verde claro / amarelado / marrom / misto
   - Uniformidade: muito uniforme / uniforme / irregular / muito irregular / extremamente irregular

4️⃣ DETECÇÃO DE PROBLEMAS E ANOMALIAS:
   
   Procure por:
   ✗ Déficit hídrico: Áreas amareladas, marrons, vegetação rala
   ✗ Pragas/Doenças: Manchas irregulares, descoloração, falhas na vegetação
   ✗ Solo exposto: Áreas sem cobertura vegetal, erosão
   ✗ Estresse nutricional: Amarelecimento uniforme, crescimento reduzido
   ✗ Compactação: Poças d'água, áreas com crescimento reduzido
   ✗ Falhas de plantio: Linhas incompletas, espaços vazios
   ✗ Invasoras: Áreas com vegetação diferente do padrão
   ✗ Danos mecânicos: Marcas de máquinas, áreas danificadas

5️⃣ ANÁLISE DE PADRÕES E MANEJO:
   - Formato do talhão: regular / irregular / circular / retangular / curvas de nível
   - Padrão de plantio: fileiras paralelas / aleatório / circular / terraceamento / sem padrão definido
   - Sinais de irrigação: pivô central / aspersão / gotejamento / sem irrigação
   - Marcas de maquinário: presentes / ausentes
   - Sistema de plantio: convencional / plantio direto / orgânico / outro

6️⃣ ESTÁGIO FENOLÓGICO (se cultura anual):
   - Estágio atual: emergência / crescimento inicial / desenvolvimento vegetativo / floração / frutificação/enchimento / maturação / pós-colheita / pousio
   - Dias estimados desde plantio: 0-30 / 30-60 / 60-90 / 90-120 / >120
   - Próxima fase esperada: [descrever]

7️⃣ RECOMENDAÇÕES AGRONÔMICAS ESPECÍFICAS:
   - Baseie-se no que observou para dar recomendações práticas e aplicáveis
   - Seja específico: "Verificar sistema de irrigação no setor nordeste" em vez de "Melhorar irrigação"

📊 RESPONDA EM JSON VÁLIDO (sem comentários, sem text markdown):
{
  "classification": "agricultural" ou "urban" ou "mixed" ou "water" ou "forest",
  "confidence": [0.0-1.0 - seja rigoroso!],
  "landUseDetails": {
    "primaryUse": "[descrição específica]",
    "secondaryUse": "[se aplicável]",
    "characteristics": ["lista", "de", "características", "observadas"]
  },
  "cropIdentification": {
    "primaryCrop": "[Nome exato da cultura ou 'unknown' ou 'pastagem' ou 'floresta']",
    "primaryCropConfidence": [0.0-1.0],
    "alternativeCrops": ["cultura2", "cultura3"] ou [],
    "reasoning": "[Explique EXATAMENTE o que você viu que te levou a essa identificação]",
    "growthStage": "[estágio específico]",
    "daysAfterPlanting": [número estimado ou null],
    "phenologicalIndicators": ["indicador1", "indicador2"]
  },
  "healthAssessment": {
    "overallHealth": "excelente/boa/regular/ruim/crítica",
    "healthScore": [0.0-1.0],
    "vegetationDensity": "alta/média/baixa",
    "coveragePercentage": [0-100],
    "colorPattern": "[descrição detalhada da cor]",
    "uniformity": "muito uniforme/uniforme/irregular/muito irregular",
    "vigorIndicators": ["indicador1", "indicador2"]
  },
  "problemsDetected": [
    {
      "type": "[tipo específico]",
      "severity": "baixa/média/alta/crítica",
      "location": "[onde na imagem]",
      "description": "[descrição detalhada]",
      "possibleCauses": ["causa1", "causa2"]
    }
  ],
  "patterns": {
    "fieldShape": "[forma específica]",
    "plantingPattern": "[padrão observado]",
    "rowSpacing": "[estimativa em cm ou 'não aplicável']",
    "irrigationSigns": true/false,
    "irrigationType": "[tipo se identificado]",
    "machineryMarks": true/false,
    "terrainTopography": "[plano/ondulado/montanhoso]",
    "soilVisibility": "[porcentagem aproximada]"
  },
  "management": {
    "plantingSystem": "[tipo de sistema]",
    "conservationPractices": ["prática1", "prática2"],
    "technologyLevel": "baixo/médio/alto/muito alto"
  },
  "recommendations": [
    {
      "priority": "alta/média/baixa",
      "action": "[ação específica e prática]",
      "reasoning": "[por que essa recomendação]",
      "expectedBenefit": "[benefício esperado]"
    }
  ],
  "detailedAnalysis": "[Análise completa e profissional de 3-5 parágrafos descrevendo tudo que você observou na imagem, como se fosse um laudo agronômico]",
  "confidence_note": "[Explique o nível de confiança da sua análise]"
}

⚠️ IMPORTANTE:
- Seja PRECISO e TÉCNICO
- Baseie-se apenas no que REALMENTE vê na imagem
- Se não tiver certeza, indique menor confiança
- Use terminologia agronômica correta
- Forneça dados quantitativos quando possível
`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(60000),
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: base64Image,
                  },
                },
              ],
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!aiResponse) {
      throw new Error("Resposta vazia da IA")
    }

    console.log("🤖 Resposta completa da IA:", aiResponse.substring(0, 500) + "...")

    // Extrair JSON da resposta com tratamento robusto
    let aiResult
    try {
      // Remover markdown se presente
      let cleanResponse = aiResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "")
      
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("JSON não encontrado na resposta")
      }
    } catch (parseError) {
      console.warn("⚠️ Erro ao parsear JSON:", parseError)
      console.log("Resposta da IA:", aiResponse.substring(0, 1000))
      aiResult = parseAIResponseText(aiResponse)
    }

    // Validar e normalizar dados
    const classification = aiResult.classification || "rural"
    const isUrban = classification === "urban"
    const isAgricultural = !isUrban && classification !== "water" && classification !== "forest"

    const result = {
      classification: isUrban ? "urban_detected" : "agricultural_detected",
      confidence: Math.max(0.5, Math.min(1.0, aiResult.confidence || 0.75)),
      isUrban,
      isAgricultural,
      
      // Informações de uso do solo
      landUseDetails: aiResult.landUseDetails || {
        primaryUse: "agricultural",
        secondaryUse: "",
        characteristics: [],
      },
      
      // Identificação de cultura aprimorada
      cropIdentification: {
        primaryCrop: aiResult.cropIdentification?.primaryCrop || "unknown",
        primaryCropConfidence: aiResult.cropIdentification?.primaryCropConfidence || 0.5,
        alternativeCrops: aiResult.cropIdentification?.alternativeCrops || [],
        reasoning: aiResult.cropIdentification?.reasoning || "Análise baseada em padrões espectrais",
        growthStage: aiResult.cropIdentification?.growthStage || "indeterminado",
        daysAfterPlanting: aiResult.cropIdentification?.daysAfterPlanting || null,
        phenologicalIndicators: aiResult.cropIdentification?.phenologicalIndicators || [],
      },
      
      // Avaliação de saúde aprimorada
      healthAssessment: {
        overallHealth: aiResult.healthAssessment?.overallHealth || "regular",
        healthScore: aiResult.healthAssessment?.healthScore || 0.6,
        vegetationDensity: aiResult.healthAssessment?.vegetationDensity || "média",
        coveragePercentage: aiResult.healthAssessment?.coveragePercentage || 50,
        colorPattern: aiResult.healthAssessment?.colorPattern || "verde normal",
        uniformity: aiResult.healthAssessment?.uniformity || "irregular",
        vigorIndicators: aiResult.healthAssessment?.vigorIndicators || [],
      },
      
      // Problemas detectados (formato aprimorado)
      problemsDetected: Array.isArray(aiResult.problemsDetected) 
        ? aiResult.problemsDetected 
        : [],
      
      // Padrões observados (expandido)
      patterns: {
        fieldShape: aiResult.patterns?.fieldShape || "irregular",
        plantingPattern: aiResult.patterns?.plantingPattern || "não identificado",
        rowSpacing: aiResult.patterns?.rowSpacing || "não aplicável",
        irrigationSigns: aiResult.patterns?.irrigationSigns || false,
        irrigationType: aiResult.patterns?.irrigationType || "não identificado",
        machineryMarks: aiResult.patterns?.machineryMarks || false,
        terrainTopography: aiResult.patterns?.terrainTopography || "plano",
        soilVisibility: aiResult.patterns?.soilVisibility || "baixa",
      },
      
      // Informações de manejo
      management: aiResult.management || {
        plantingSystem: "convencional",
        conservationPractices: [],
        technologyLevel: "médio",
      },
      
      // Recomendações detalhadas
      recommendations: Array.isArray(aiResult.recommendations) 
        ? aiResult.recommendations 
        : [],
      
      // Análise detalhada
      detailedAnalysis: aiResult.detailedAnalysis || "Análise não disponível",
      confidenceNote: aiResult.confidence_note || "",
      
      // Dados legados (compatibilidade)
      reasoning: aiResult.detailedAnalysis || "Análise visual por IA",
      details: aiResult.detailedAnalysis || "",
      rawResponse: aiResponse,
    }

    console.log(`✅ IA classificou: ${result.classification} (confiança: ${(result.confidence * 100).toFixed(1)}%)`)
    console.log(`🌱 Cultura identificada: ${result.cropIdentification.primaryCrop} (${(result.cropIdentification.primaryCropConfidence * 100).toFixed(1)}%)`)
    console.log(`🌾 Estágio fenológico: ${result.cropIdentification.growthStage}`)
    console.log(`💚 Saúde: ${result.healthAssessment.overallHealth} (score: ${result.healthAssessment.healthScore.toFixed(2)})`)
    console.log(`📊 Cobertura: ${result.healthAssessment.coveragePercentage}%`)
    console.log(`⚠️ Problemas detectados: ${result.problemsDetected.length}`)
    
    if (result.problemsDetected.length > 0) {
      result.problemsDetected.forEach((problem: any, idx: number) => {
        console.log(`   ${idx + 1}. ${problem.type || problem} - ${problem.severity || 'N/A'}`)
      })
    }

    return result
  } catch (error) {
    console.error("❌ Erro na análise de IA:", error)
    return getAIAnalysisFallback()
  }
}

// PROCESSAR DADOS ESPECTRAIS AVANÇADOS
async function processAdvancedSpectralData(buffers: any) {
  console.log("🔬 Processando dados espectrais avançados...")

  const results: any = {}

  // Extrair todos os índices
  if (buffers.ndvi) results.ndvi = await extractDataFromTiff(buffers.ndvi, "NDVI")
  if (buffers.evi) results.evi = await extractDataFromTiff(buffers.evi, "EVI")
  if (buffers.savi) results.savi = await extractDataFromTiff(buffers.savi, "SAVI")
  if (buffers.urban) results.urban = await extractDataFromTiff(buffers.urban, "URBAN")
  if (buffers.water) results.water = await extractDataFromTiff(buffers.water, "WATER")
  if (buffers.moisture) results.moisture = await extractDataFromTiff(buffers.moisture, "MOISTURE")

  // Fallbacks
  const ndviData = results.ndvi || generateFallback("NDVI")
  const eviData = results.evi || generateFallback("EVI")
  const saviData = results.savi || generateFallback("SAVI")
  const urbanData = results.urban || generateFallback("URBAN")
  const waterData = results.water || generateFallback("WATER")
  const moistureData = results.moisture || generateFallback("MOISTURE")

  // ANÁLISE AVANÇADA DE COBERTURA
  const totalPixels = ndviData.validPixels.length

  // Vegetação por categorias com tipos explícitos
  const excellentVegetation = ndviData.validPixels.filter((val: number) => val > 0.6).length
  const goodVegetation = ndviData.validPixels.filter((val: number) => val > 0.4 && val <= 0.6).length
  const moderateVegetation = ndviData.validPixels.filter((val: number) => val > 0.2 && val <= 0.4).length
  const poorVegetation = ndviData.validPixels.filter((val: number) => val > 0.1 && val <= 0.2).length
  const noVegetation = ndviData.validPixels.filter((val: number) => val <= 0.1).length

  // Outras categorias
  const urbanPixels = urbanData.validPixels.filter((val: number) => val > 0.1).length
  const waterPixels = waterData.validPixels.filter((val: number) => val > 0.3).length
  const wetSoilPixels = moistureData.validPixels.filter((val: number) => val > 0.2).length

  // Validação de dados espectrais (detectar anomalias)
  const ndviStats = calculateStatistics(ndviData.validPixels)
  const eviStats = calculateStatistics(eviData.validPixels)
  
  const spectralQuality = {
    ndviValid: ndviStats.mean >= -1 && ndviStats.mean <= 1,
    eviValid: eviStats.mean >= -1 && eviStats.mean <= 1,
    dataCompleteness: (ndviData.validPixels.length / (ndviData.validPixels.length + 100)) * 100, // aproximado
    anomaliesDetected: detectSpectralAnomalies(ndviData.validPixels, eviData.validPixels),
  }

  const advancedLandCover = {
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

  // ANÁLISE DE VARIABILIDADE
  const ndviVariability = calculateVariability(ndviData.validPixels)
  const moistureVariability = calculateVariability(moistureData.validPixels)

  // IDENTIFICAÇÃO DE CULTURA POR DADOS ESPECTRAIS
  const spectralCropIdentification = identifyCropBySpectralData(
    ndviStats.mean,
    eviStats.mean,
    saviData.mean
  )

  console.log(`🌱 Vegetação total: ${advancedLandCover.vegetation.total.toFixed(1)}%`)
  console.log(`⭐ Vegetação excelente: ${advancedLandCover.vegetation.excellent.toFixed(1)}%`)
  console.log(`💧 Umidade do solo: ${advancedLandCover.wetSoil.toFixed(1)}%`)
  console.log(`📊 Variabilidade NDVI: ${ndviVariability.coefficient.toFixed(3)}`)
  console.log(`🌾 Cultura por assinatura espectral: ${spectralCropIdentification.crop} (confiança: ${(spectralCropIdentification.confidence * 100).toFixed(1)}%)`)
  console.log(`🔬 Qualidade espectral: ${spectralQuality.anomaliesDetected.length === 0 ? 'OK' : `${spectralQuality.anomaliesDetected.length} anomalias`}`)

  return {
    ndvi: ndviData,
    evi: eviData,
    savi: saviData,
    urban: urbanData,
    water: waterData,
    moisture: moistureData,
    landCover: advancedLandCover,
    variability: {
      ndvi: ndviVariability,
      moisture: moistureVariability,
    },
    spectralCropIdentification,
    spectralQuality,
    dominantLandUse:
      advancedLandCover.vegetation.total > 50 ? "vegetation" : advancedLandCover.urban > 30 ? "urban" : "mixed",
    qualityMetrics: {
      dataQuality: calculateDataQuality([ndviData, eviData, saviData]),
      spatialConsistency: calculateSpatialConsistency(ndviData.validPixels),
      temporalStability: 0.85, // Seria calculado com dados históricos
    },
  }
}

// ANÁLISE COMPLETA COMBINADA
async function performCompleteAnalysis(aiAnalysis: any, spectralAnalysis: any, coordinates: any) {
  console.log("🎯 Realizando análise completa combinada...")

  const { ndvi, evi, savi, urban, water, moisture, landCover, variability } = spectralAnalysis

  // CLASSIFICAÇÃO PRINCIPAL (IA tem prioridade)
  let classification = "unknown"
  let confidence = aiAnalysis.confidence
  let isUrban = aiAnalysis.isUrban
  let isAgricultural = aiAnalysis.isAgricultural

  // REFINAR CLASSIFICAÇÃO
  if (aiAnalysis.isUrban) {
    classification = ndvi.mean < 0.2 ? "urban_dense" : "urban_mixed"
    confidence = Math.min(0.95, confidence + (ndvi.mean < 0.2 ? 0.1 : 0.05))
  } else if (aiAnalysis.isAgricultural) {
    if (ndvi.mean > 0.6) {
      classification = "agricultural_excellent"
    } else if (ndvi.mean > 0.4) {
      classification = "agricultural_healthy"
    } else if (ndvi.mean > 0.2) {
      classification = "agricultural_moderate"
    } else {
      classification = "agricultural_poor"
    }
    confidence = Math.min(0.95, confidence + 0.05)
  }

  // Verificar água
  if (water.mean > 0.3) {
    classification = "water_body"
    confidence = 0.9
    isUrban = false
    isAgricultural = false
  }

  // CALCULAR SCORE DE SAÚDE
  const healthScore = calculateHealthScore(ndvi, evi, moisture, aiAnalysis.healthAssessment)

  // DETECTAR PROBLEMAS
  const issues = detectIssues(spectralAnalysis, aiAnalysis, healthScore)

  // CALCULAR MÉTRICAS AVANÇADAS
  const advancedMetrics = calculateAdvancedMetrics(spectralAnalysis, aiAnalysis)

  // PONTOS DE RETORNO (comparação com padrões)
  const returnPoints = calculateReturnPoints(spectralAnalysis, classification)

  console.log(`🎯 Classificação final: ${classification}`)
  console.log(`💚 Score de saúde: ${healthScore.toFixed(1)}/100`)
  console.log(`⚠️ Issues detectados: ${issues.length}`)

  // DETERMINAR MELHOR CULTURA IDENTIFICADA (combinar IA + dados espectrais)
  let finalCropIdentification = aiAnalysis.cropIdentification?.primaryCrop || "unknown"
  let finalCropConfidence = aiAnalysis.cropIdentification?.primaryCropConfidence || 0.5

  // Se a análise espectral tem alta confiança, considerar ela também
  if (spectralAnalysis.spectralCropIdentification && spectralAnalysis.spectralCropIdentification.confidence > 0.7) {
    if (finalCropIdentification === "unknown" || finalCropConfidence < 0.6) {
      finalCropIdentification = spectralAnalysis.spectralCropIdentification.crop
      finalCropConfidence = spectralAnalysis.spectralCropIdentification.confidence
    }
  }

  // Gerar recomendações específicas da cultura
  const cropSpecificRecommendations = getCropRecommendations(finalCropIdentification, healthScore / 100)

  return {
    classification,
    confidence,
    description: getClassificationDescription(classification),
    isAgricultural,
    isUrban,
    needsAttention: issues.length > 0 || healthScore < 70,
    healthScore,
    issues,
    cropType: finalCropIdentification,
    cropConfidence: finalCropConfidence,
    growthStage: aiAnalysis.cropIdentification?.growthStage || "unknown",
    cropSpecificRecommendations,
    urbanizationLevel: landCover.urban,
    vegetationHealth: ndvi.mean,
    moistureLevel: moisture.mean,
    variabilityIndex: variability.ndvi.coefficient,
    advancedMetrics,
    returnPoints,
    spectralCropIdentification: spectralAnalysis.spectralCropIdentification,
    aiAnalysis: {
      classification: aiAnalysis.classification,
      reasoning: aiAnalysis.reasoning,
      details: aiAnalysis.details,
      confidence: aiAnalysis.confidence,
      cropIdentification: aiAnalysis.cropIdentification,
      healthAssessment: aiAnalysis.healthAssessment,
      problemsDetected: aiAnalysis.problemsDetected,
      patterns: aiAnalysis.patterns,
      recommendations: aiAnalysis.recommendations,
      landUseDetails: aiAnalysis.landUseDetails,
      management: aiAnalysis.management,
      detailedAnalysis: aiAnalysis.detailedAnalysis,
    },
    spectralMetrics: {
      ndvi: ndvi.mean,
      evi: evi.mean,
      savi: savi.mean,
      urban: urban.mean,
      water: water.mean,
      moisture: moisture.mean,
    },
  }
}

// FUNÇÕES AUXILIARES AVANÇADAS
function calculateVariability(values: number[]) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
  const std = Math.sqrt(variance)
  const coefficient = std / Math.abs(mean)

  return {
    mean,
    std,
    variance,
    coefficient,
    interpretation: coefficient < 0.2 ? "baixa" : coefficient < 0.5 ? "média" : "alta",
  }
}

function calculateHealthScore(ndvi: any, evi: any, moisture: any, healthAssessment: any) {
  let score = 0

  // NDVI (40% do score)
  if (ndvi.mean > 0.6) score += 40
  else if (ndvi.mean > 0.4) score += 30
  else if (ndvi.mean > 0.2) score += 20
  else score += 10

  // EVI (25% do score)
  if (evi.mean > 0.4) score += 25
  else if (evi.mean > 0.2) score += 18
  else if (evi.mean > 0.1) score += 12
  else score += 5

  // Umidade (20% do score)
  if (moisture.mean > 0.3) score += 20
  else if (moisture.mean > 0.1) score += 15
  else if (moisture.mean > 0) score += 10
  else score += 5

  // Avaliação da IA (15% do score)
  switch (healthAssessment.overallHealth) {
    case "excelente":
      score += 15
      break
    case "boa":
      score += 12
      break
    case "regular":
      score += 8
      break
    case "ruim":
      score += 4
      break
    default:
      score += 2
  }

  return Math.min(100, Math.max(0, score))
}

function detectIssues(spectralAnalysis: any, aiAnalysis: any, healthScore: number) {
  const issues = []

  // Issues baseados em dados espectrais
  if (spectralAnalysis.ndvi.mean < 0.2) {
    issues.push({
      type: "vegetation_stress",
      severity: "high",
      description: "Vegetação com estresse severo ou ausente",
      recommendation: "Investigar causas: seca, pragas, doenças ou solo inadequado",
    })
  }

  if (spectralAnalysis.moisture.mean < 0.1) {
    issues.push({
      type: "low_moisture",
      severity: "medium",
      description: "Baixa umidade do solo detectada",
      recommendation: "Considerar irrigação ou aguardar chuvas",
    })
  }

  if (spectralAnalysis.variability.ndvi.coefficient > 0.5) {
    issues.push({
      type: "high_variability",
      severity: "medium",
      description: "Alta variabilidade na vegetação",
      recommendation: "Investigar desuniformidade: pragas, doenças ou manejo inadequado",
    })
  }

  // Issues da IA
  aiAnalysis.problemsDetected.forEach((problem: string) => {
    issues.push({
      type: "ai_detected",
      severity: "medium",
      description: problem,
      recommendation: "Verificar visualmente a área identificada",
    })
  })

  // Issues baseados no score de saúde
  if (healthScore < 50) {
    issues.push({
      type: "poor_health",
      severity: "high",
      description: "Score de saúde crítico",
      recommendation: "Intervenção urgente necessária",
    })
  }

  return issues
}

function calculateAdvancedMetrics(spectralAnalysis: any, aiAnalysis: any) {
  return {
    productivityIndex: calculateProductivityIndex(spectralAnalysis.ndvi, spectralAnalysis.evi),
    stressIndex: calculateStressIndex(spectralAnalysis.ndvi, spectralAnalysis.moisture),
    uniformityIndex: 1 - spectralAnalysis.variability.ndvi.coefficient,
    sustainabilityScore: calculateSustainabilityScore(spectralAnalysis, aiAnalysis),
    riskAssessment: calculateRiskAssessment(spectralAnalysis, aiAnalysis),
  }
}

function calculateProductivityIndex(ndvi: any, evi: any) {
  const ndviScore = Math.max(0, Math.min(1, (ndvi.mean + 1) / 2))
  const eviScore = Math.max(0, Math.min(1, (evi.mean + 1) / 2))
  return ((ndviScore * 0.6 + eviScore * 0.4) * 100).toFixed(1)
}

function calculateStressIndex(ndvi: any, moisture: any) {
  const ndviStress = ndvi.mean < 0.3 ? 1 - ndvi.mean / 0.3 : 0
  const moistureStress = moisture.mean < 0.2 ? 1 - moisture.mean / 0.2 : 0
  return ((ndviStress * 0.7 + moistureStress * 0.3) * 100).toFixed(1)
}

function calculateSustainabilityScore(spectralAnalysis: any, aiAnalysis: any) {
  let score = 70 // Base score

  // Bonus por boa cobertura vegetal
  if (spectralAnalysis.landCover.vegetation.total > 80) score += 15
  else if (spectralAnalysis.landCover.vegetation.total > 60) score += 10

  // Bonus por baixa variabilidade (uniformidade)
  if (spectralAnalysis.variability.ndvi.coefficient < 0.3) score += 10

  // Penalty por problemas detectados
  score -= aiAnalysis.problemsDetected.length * 5

  return Math.max(0, Math.min(100, score))
}

function calculateRiskAssessment(spectralAnalysis: any, aiAnalysis: any) {
  const risks = []

  if (spectralAnalysis.ndvi.mean < 0.3) {
    risks.push({ type: "productivity", level: "high", description: "Risco de baixa produtividade" })
  }

  if (spectralAnalysis.moisture.mean < 0.15) {
    risks.push({ type: "drought", level: "medium", description: "Risco de estresse hídrico" })
  }

  if (spectralAnalysis.variability.ndvi.coefficient > 0.4) {
    risks.push({ type: "uniformity", level: "medium", description: "Risco de desuniformidade na produção" })
  }

  return risks
}

function calculateReturnPoints(spectralAnalysis: any, classification: string) {
  const benchmarks = {
    agricultural_excellent: { ndvi: 0.7, evi: 0.5, moisture: 0.4 },
    agricultural_healthy: { ndvi: 0.5, evi: 0.3, moisture: 0.3 },
    agricultural_moderate: { ndvi: 0.3, evi: 0.2, moisture: 0.2 },
  }

  const currentBenchmark = benchmarks[classification as keyof typeof benchmarks]
  if (!currentBenchmark) return null

  return {
    current: {
      ndvi: spectralAnalysis.ndvi.mean,
      evi: spectralAnalysis.evi.mean,
      moisture: spectralAnalysis.moisture.mean,
    },
    target: currentBenchmark,
    gaps: {
      ndvi: Math.max(0, currentBenchmark.ndvi - spectralAnalysis.ndvi.mean),
      evi: Math.max(0, currentBenchmark.evi - spectralAnalysis.evi.mean),
      moisture: Math.max(0, currentBenchmark.moisture - spectralAnalysis.moisture.mean),
    },
    recommendations: generateReturnPointRecommendations(currentBenchmark, spectralAnalysis),
  }
}

function generateReturnPointRecommendations(benchmark: any, spectralAnalysis: any) {
  const recommendations = []

  if (spectralAnalysis.ndvi.mean < benchmark.ndvi) {
    recommendations.push("Melhorar saúde da vegetação através de adubação ou controle de pragas")
  }

  if (spectralAnalysis.moisture.mean < benchmark.moisture) {
    recommendations.push("Aumentar umidade do solo através de irrigação ou cobertura morta")
  }

  return recommendations
}

function calculateDataQuality(datasets: any[]) {
  const validDatasets = datasets.filter((d) => d && d.validPixels && d.validPixels.length > 100)
  return (validDatasets.length / datasets.length) * 100
}

function calculateSpatialConsistency(values: number[]) {
  const chunks = []
  const chunkSize = Math.floor(values.length / 10)

  for (let i = 0; i < values.length; i += chunkSize) {
    chunks.push(values.slice(i, i + chunkSize))
  }

  const chunkMeans = chunks.map((chunk) => chunk.reduce((a, b) => a + b, 0) / chunk.length)
  const overallMean = chunkMeans.reduce((a, b) => a + b, 0) / chunkMeans.length
  const variance = chunkMeans.reduce((a, b) => a + Math.pow(b - overallMean, 2), 0) / chunkMeans.length

  return Math.max(0, 1 - variance) * 100
}

// INTERPRETAÇÃO COMPLETA
async function generateCompleteInterpretation(
  spectralAnalysis: any,
  completeAnalysis: any,
  coordinates: any,
  apiKey: string,
) {
  if (!apiKey) return "Interpretação de IA não disponível"

  const prompt = `
RELATÓRIO TÉCNICO COMPLETO - ANÁLISE AGRÍCOLA

LOCALIZAÇÃO: ${coordinates.lat}, ${coordinates.lng}

CLASSIFICAÇÃO FINAL: ${completeAnalysis.classification}
CULTURA IDENTIFICADA: ${completeAnalysis.cropType}
ESTÁGIO: ${completeAnalysis.growthStage}
SCORE DE SAÚDE: ${completeAnalysis.healthScore}/100

DADOS ESPECTRAIS:
- NDVI: ${spectralAnalysis.ndvi.mean.toFixed(3)} (vegetação)
- EVI: ${spectralAnalysis.evi.mean.toFixed(3)} (vegetação aprimorada)
- Umidade: ${spectralAnalysis.moisture.mean.toFixed(3)}
- Variabilidade: ${spectralAnalysis.variability.ndvi.coefficient.toFixed(3)}

MÉTRICAS AVANÇADAS:
- Índice Produtividade: ${completeAnalysis.advancedMetrics.productivityIndex}%
- Índice Estresse: ${completeAnalysis.advancedMetrics.stressIndex}%
- Score Sustentabilidade: ${completeAnalysis.advancedMetrics.sustainabilityScore}%

PROBLEMAS DETECTADOS: ${completeAnalysis.issues.length}
${completeAnalysis.issues.map((issue: any) => `- ${issue.description}`).join("\n")}

ANÁLISE DA IA:
${completeAnalysis.aiAnalysis.reasoning}

Gere um relatório técnico completo explicando:
1. Estado atual da fazenda
2. Problemas identificados e suas causas
3. Recomendações específicas
4. Prognóstico para próximos 30 dias
5. Ações prioritárias

Máximo 500 palavras, linguagem técnica mas acessível.
`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(60000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    )

    if (response.ok) {
      const data = await response.json()
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Análise não disponível"
    }
  } catch (error) {
    console.warn("Erro na IA:", error)
  }

  return "Interpretação de IA temporariamente indisponível"
}

// PREVISÕES AVANÇADAS
async function generateAdvancedPredictions(
  spectralAnalysis: any,
  completeAnalysis: any,
  aiAnalysis: any,
  apiKey: string,
) {
  const predictions = []
  const recommendations = []

  // Previsões baseadas no score de saúde
  if (completeAnalysis.healthScore > 80) {
    predictions.push("Excelente potencial produtivo para os próximos 30 dias")
    predictions.push("Condições favoráveis para desenvolvimento da cultura")
  } else if (completeAnalysis.healthScore > 60) {
    predictions.push("Bom potencial produtivo com alguns pontos de atenção")
    predictions.push("Monitoramento recomendado para manter qualidade")
  } else {
    predictions.push("Potencial produtivo comprometido - intervenção necessária")
    predictions.push("Risco de perdas se não houver ação corretiva")
  }

  // Previsões baseadas na cultura
  if (completeAnalysis.cropType !== "unknown") {
    predictions.push(`Cultura ${completeAnalysis.cropType} em estágio ${completeAnalysis.growthStage}`)

    // Recomendações específicas por cultura
    switch (completeAnalysis.cropType.toLowerCase()) {
      case "soja":
        recommendations.push("Monitorar ferrugem asiática")
        recommendations.push("Verificar necessidade de potássio")
        break
      case "milho":
        recommendations.push("Atenção à lagarta-do-cartucho")
        recommendations.push("Monitorar níveis de nitrogênio")
        break
      case "cana-de-açúcar":
        recommendations.push("Verificar brotação e perfilhamento")
        recommendations.push("Controlar plantas daninhas")
        break
      default:
        recommendations.push("Seguir calendário específico da cultura")
    }
  }

  // Recomendações baseadas em problemas
  completeAnalysis.issues.forEach((issue: any) => {
    recommendations.push(issue.recommendation)
  })

  // Recomendações da IA
  aiAnalysis.recommendations.forEach((rec: string) => {
    recommendations.push(rec)
  })

  return {
    predictions,
    recommendations: [...new Set(recommendations)], // Remove duplicatas
    nextAnalysisDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    priority: completeAnalysis.healthScore < 60 ? "high" : completeAnalysis.healthScore < 80 ? "medium" : "low",
    expectedYield: calculateExpectedYield(completeAnalysis, spectralAnalysis),
    riskFactors: completeAnalysis.advancedMetrics.riskAssessment,
  }
}

// PLANO DE MONITORAMENTO AVANÇADO
async function generateMonitoringPlan(spectralAnalysis: any, completeAnalysis: any, aiAnalysis: any, apiKey: string) {
  const frequency =
    completeAnalysis.healthScore < 60 ? "semanal" : completeAnalysis.healthScore < 80 ? "quinzenal" : "mensal"

  const parameters = [
    "NDVI (saúde vegetação)",
    "EVI (vegetação aprimorada)",
    "Umidade do solo",
    "Variabilidade espacial",
  ]

  if (completeAnalysis.cropType !== "unknown") {
    parameters.push(`Estágio ${completeAnalysis.cropType}`)
  }

  const alerts = []

  if (completeAnalysis.healthScore < 70) {
    alerts.push("Alerta: Score de saúde abaixo do ideal")
  }

  if (spectralAnalysis.variability.ndvi.coefficient > 0.4) {
    alerts.push("Alerta: Alta variabilidade detectada")
  }

  completeAnalysis.issues.forEach((issue: any) => {
    if (issue.severity === "high") {
      alerts.push(`Alerta crítico: ${issue.description}`)
    }
  })

  return {
    frequency,
    parameters,
    alerts,
    actions: [
      "Análise espectral regular",
      "Monitoramento visual",
      "Verificação de umidade",
      "Controle de pragas e doenças",
    ],
    thresholds: {
      ndvi_min: 0.3,
      moisture_min: 0.2,
      variability_max: 0.5,
    },
    notifications: {
      email: true,
      sms: completeAnalysis.healthScore < 60,
      dashboard: true,
    },
    reportSchedule: {
      weekly: frequency === "semanal",
      biweekly: frequency === "quinzenal",
      monthly: frequency === "mensal",
    },
  }
}

function calculateExpectedYield(completeAnalysis: any, spectralAnalysis: any) {
  const baseYield = 100 // Yield base em %

  let yieldFactor = 1.0

  // Ajuste baseado no NDVI
  if (spectralAnalysis.ndvi.mean > 0.6) yieldFactor *= 1.2
  else if (spectralAnalysis.ndvi.mean > 0.4) yieldFactor *= 1.0
  else if (spectralAnalysis.ndvi.mean > 0.2) yieldFactor *= 0.8
  else yieldFactor *= 0.5

  // Ajuste baseado no score de saúde
  yieldFactor *= completeAnalysis.healthScore / 100

  // Ajuste baseado em problemas
  yieldFactor *= Math.max(0.3, 1 - completeAnalysis.issues.length * 0.1)

  return {
    percentage: Math.round(baseYield * yieldFactor),
    confidence: completeAnalysis.confidence,
    factors: {
      vegetation: spectralAnalysis.ndvi.mean,
      health: completeAnalysis.healthScore,
      issues: completeAnalysis.issues.length,
    },
  }
}

// FALLBACKS E FUNÇÕES AUXILIARES
function getAIAnalysisFallback() {
  return {
    classification: "agricultural_detected",
    confidence: 0.7,
    isUrban: false,
    isAgricultural: true,
    cropIdentification: {
      primaryCrop: "unknown",
      confidence: 0.5,
      growthStage: "unknown",
      reasoning: "Análise de IA não disponível",
    },
    healthAssessment: {
      overallHealth: "regular",
      vegetationDensity: "média",
      colorPattern: "verde normal",
      uniformity: "irregular",
    },
    problemsDetected: [],
    patterns: {},
    recommendations: ["Consultar técnico agrícola"],
    reasoning: "Análise de IA não disponível",
    details: "Sistema funcionando em modo fallback",
    rawResponse: "",
  }
}

function parseAIResponseText(response: string) {
  const isUrban = response.toLowerCase().includes("urban") || response.toLowerCase().includes("cidade")
  const isRural = response.toLowerCase().includes("rural") || response.toLowerCase().includes("fazenda")

  return {
    classification: isUrban && !isRural ? "urban" : "rural",
    confidence: 0.8,
    cropIdentification: {
      primaryCrop: "unknown",
      confidence: 0.5,
      growthStage: "unknown",
      reasoning: "Análise baseada em texto",
    },
    healthAssessment: {
      overallHealth: "regular",
      vegetationDensity: "média",
      colorPattern: "verde normal",
      uniformity: "irregular",
    },
    problemsDetected: [],
    patterns: {},
    recommendations: [],
    reasoning: response.substring(0, 200),
    details: response,
  }
}

// FUNÇÕES AUXILIARES MANTIDAS (extractDataFromTiff, generateFallback, etc.)
async function extractDataFromTiff(buffer: ArrayBuffer, indexName: string) {
  const uint8Array = new Uint8Array(buffer)
  const values = []

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

  if (values.length === 0) return generateFallback(indexName)

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

// Função para calcular estatísticas de um array de valores
function calculateStatistics(values: number[]) {
  if (!values || values.length === 0) {
    return { mean: 0, median: 0, std: 0, min: 0, max: 0 }
  }

  const sorted = [...values].sort((a, b) => a - b)
  const sum = values.reduce((acc, val) => acc + val, 0)
  const mean = sum / values.length
  
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)]
  
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
  const std = Math.sqrt(variance)
  
  return {
    mean: Number(mean.toFixed(4)),
    median: Number(median.toFixed(4)),
    std: Number(std.toFixed(4)),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  }
}

// Função para detectar anomalias espectrais
function detectSpectralAnomalies(ndviValues: number[], eviValues: number[]): string[] {
  const anomalies: string[] = []
  
  // Calcular estatísticas
  const ndviStats = calculateStatistics(ndviValues)
  const eviStats = calculateStatistics(eviValues)
  
  // Detectar valores fora do esperado
  if (ndviStats.mean < -0.5 || ndviStats.mean > 1.0) {
    anomalies.push(`NDVI fora da faixa normal: ${ndviStats.mean.toFixed(3)}`)
  }
  
  if (eviStats.mean < -0.5 || eviStats.mean > 1.0) {
    anomalies.push(`EVI fora da faixa normal: ${eviStats.mean.toFixed(3)}`)
  }
  
  // Detectar variação excessiva (possível erro ou heterogeneidade extrema)
  if (ndviStats.std > 0.3) {
    anomalies.push(`Alta variação no NDVI (std: ${ndviStats.std.toFixed(3)})`)
  }
  
  if (eviStats.std > 0.3) {
    anomalies.push(`Alta variação no EVI (std: ${eviStats.std.toFixed(3)})`)
  }
  
  // Detectar inconsistência entre índices (NDVI e EVI geralmente correlacionam)
  const ndviEviRatio = ndviStats.mean / (eviStats.mean + 0.001) // evitar divisão por zero
  if (ndviEviRatio < 0.5 || ndviEviRatio > 3.0) {
    anomalies.push(`Inconsistência entre NDVI e EVI (razão: ${ndviEviRatio.toFixed(2)})`)
  }
  
  // Detectar valores negativos em excesso (sinal de água ou erro)
  const negativeNdvi = ndviValues.filter(v => v < 0).length
  const negativePercentage = (negativeNdvi / ndviValues.length) * 100
  if (negativePercentage > 30) {
    anomalies.push(`Alto percentual de NDVI negativo: ${negativePercentage.toFixed(1)}%`)
  }
  
  return anomalies
}

function generateFallback(indexName: string) {
  const values = []
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

function getClassificationDescription(classification: string): string {
  const descriptions: { [key: string]: string } = {
    urban_dense: "CIDADE DENSA - Área urbana com muitas construções",
    urban_mixed: "CIDADE MISTA - Área urbana com algumas áreas verdes",
    agricultural_excellent: "FAZENDA EXCELENTE - Vegetação muito saudável",
    agricultural_healthy: "FAZENDA SAUDÁVEL - Boa vegetação",
    agricultural_moderate: "FAZENDA MODERADA - Vegetação regular",
    agricultural_poor: "FAZENDA PROBLEMÁTICA - Vegetação com problemas",
    water_body: "CORPO D'ÁGUA - Rio, lago ou represa",
    mixed_area: "ÁREA MISTA - Combinação de usos",
  }
  return descriptions[classification] || "Área indefinida"
}

// FUNÇÕES DE TOKEN E DOWNLOAD (mantidas iguais)
async function getSentinelToken() {
  const params = new URLSearchParams()
  params.append("grant_type", "client_credentials")
  params.append("client_id", CLIENT_ID)
  params.append("client_secret", CLIENT_SECRET)

  const response = await fetch("https://services.sentinel-hub.com/oauth/token", {
    method: "POST",
    body: params,
    signal: AbortSignal.timeout(60000),
  })

  const data = await response.json()
  return data.access_token
}

function getDateRange(daysBack = 30) {
  const now = new Date()
  const pastDate = new Date(now)
  pastDate.setUTCDate(now.getUTCDate() - daysBack)

  const format = (date: Date) =>
    `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}T00:00:00Z`

  return {
    from: format(pastDate),
    to: format(now),
  }
}

async function downloadSentinelImage(
  accessToken: string,
  timeRange: any,
  bbox: number[],
  evalscript: string,
  formatType: string,
) {
  const url = "https://services.sentinel-hub.com/api/v1/process"

  const body = {
    input: {
      bounds: {
        bbox,
        properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
      },
      data: [
        {
          type: "sentinel-2-l2a",
          dataFilter: {
            timeRange,
            mosaickingOrder: "mostRecent",
            maxCloudCoverage: 30,
          },
        },
      ],
    },
    output: {
      width: 512,
      height: 512,
      responses: [
        {
          identifier: "default",
          format: { type: formatType },
        },
      ],
    },
    evalscript,
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: formatType === "image/tiff" ? "application/octet-stream" : formatType,
    },
    signal: AbortSignal.timeout(60000),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Erro ${response.status}:`, errorText)
    throw new Error(`Erro ao baixar imagem: ${response.status}`)
  }

  return await response.arrayBuffer()
}

// EVALSCRIPTS (incluindo novo para umidade)
const EVALSCRIPT_TRUE_COLOR_HD = `//VERSION=3
function setup() {
  return {
    input: ["B04", "B03", "B02"],
    output: { bands: 3 }
  };
}
function evaluatePixel(sample) {
  return [
    Math.min(1, sample.B04 * 2.5),
    Math.min(1, sample.B03 * 2.5), 
    Math.min(1, sample.B02 * 2.5)
  ];
}`

const EVALSCRIPT_NDVI_REAL = `//VERSION=3
function setup() {
  return {
    input: ["B04", "B08"],
    output: { 
      bands: 1,
      sampleType: "FLOAT32"
    }
  };
}
function evaluatePixel(sample) {
  let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
  return [ndvi];
}`

const EVALSCRIPT_EVI_REAL = `//VERSION=3
function setup() {
  return {
    input: ["B02", "B04", "B08"],
    output: { 
      bands: 1,
      sampleType: "FLOAT32"
    }
  };
}
function evaluatePixel(sample) {
  let evi = 2.5 * (sample.B08 - sample.B04) / (sample.B08 + 6 * sample.B04 - 7.5 * sample.B02 + 1);
  return [evi];
}`

const EVALSCRIPT_SAVI_REAL = `//VERSION=3
function setup() {
  return {
    input: ["B04", "B08"],
    output: { 
      bands: 1,
      sampleType: "FLOAT32"
    }
  };
}
function evaluatePixel(sample) {
  let savi = ((sample.B08 - sample.B04) / (sample.B08 + sample.B04 + 0.5)) * 1.5;
  return [savi];
}`

const EVALSCRIPT_URBAN_REAL = `//VERSION=3
function setup() {
  return {
    input: ["B08", "B11"],
    output: { 
      bands: 1,
      sampleType: "FLOAT32"
    }
  };
}
function evaluatePixel(sample) {
  let ui = (sample.B11 - sample.B08) / (sample.B11 + sample.B08);
  return [ui];
}`

const EVALSCRIPT_WATER_REAL = `//VERSION=3
function setup() {
  return {
    input: ["B03", "B08"],
    output: { 
      bands: 1,
      sampleType: "FLOAT32"
    }
  };
}
function evaluatePixel(sample) {
  let ndwi = (sample.B03 - sample.B08) / (sample.B03 + sample.B08);
  return [ndwi];
}`

const EVALSCRIPT_MOISTURE_REAL = `//VERSION=3
function setup() {
  return {
    input: ["B08", "B11"],
    output: { 
      bands: 1,
      sampleType: "FLOAT32"
    }
  };
}
function evaluatePixel(sample) {
  let ndmi = (sample.B08 - sample.B11) / (sample.B08 + sample.B11);
  return [ndmi];
}`

// EVALSCRIPTS VISUAIS
const EVALSCRIPT_NDVI_VISUAL = `//VERSION=3
function setup() {
  return {
    input: ["B04", "B08"],
    output: { bands: 3 }
  };
}
function evaluatePixel(sample) {
  let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
  
  if (ndvi > 0.7) return [0, 1, 0];        
  if (ndvi > 0.5) return [0.2, 0.9, 0];    
  if (ndvi > 0.3) return [0.5, 0.8, 0];    
  if (ndvi > 0.1) return [0.8, 0.8, 0];    
  if (ndvi > 0) return [1, 0.6, 0];        
  return [1, 0, 0];                        
}`

const EVALSCRIPT_EVI_VISUAL = `//VERSION=3
function setup() {
  return {
    input: ["B02", "B04", "B08"],
    output: { bands: 3 }
  };
}
function evaluatePixel(sample) {
  let evi = 2.5 * (sample.B08 - sample.B04) / (sample.B08 + 6 * sample.B04 - 7.5 * sample.B02 + 1);
  
  if (evi > 0.6) return [0, 0.8, 0.2];     
  if (evi > 0.4) return [0.3, 0.9, 0.1];   
  if (evi > 0.2) return [0.7, 0.8, 0];     
  if (evi > 0.1) return [1, 0.7, 0];       
  return [0.8, 0.3, 0.1];                  
}`

const EVALSCRIPT_SAVI_VISUAL = `//VERSION=3
function setup() {
  return {
    input: ["B04", "B08"],
    output: { bands: 3 }
  };
}
function evaluatePixel(sample) {
  let savi = ((sample.B08 - sample.B04) / (sample.B08 + sample.B04 + 0.5)) * 1.5;
  
  if (savi > 0.5) return [0.1, 0.9, 0.1];  
  if (savi > 0.3) return [0.4, 0.8, 0.2];  
  if (savi > 0.1) return [0.7, 0.7, 0.3];  
  return [0.6, 0.4, 0.2];                  
}`

const EVALSCRIPT_URBAN_VISUAL = `//VERSION=3
function setup() {
  return {
    input: ["B08", "B11", "B04"],
    output: { bands: 3 }
  };
}
function evaluatePixel(sample) {
  let ui = (sample.B11 - sample.B08) / (sample.B11 + sample.B08);
  
  if (ui > 0.3) return [1, 0, 1];          
  if (ui > 0.15) return [0.9, 0.3, 0.9];   
  if (ui > 0.05) return [0.8, 0.6, 0.2];   
  if (ui > -0.1) return [0.3, 0.8, 0.3];   
  return [0.1, 0.6, 0.1];                  
}`

const EVALSCRIPT_MOISTURE_VISUAL = `//VERSION=3
function setup() {
  return {
    input: ["B08", "B11"],
    output: { bands: 3 }
  };
}
function evaluatePixel(sample) {
  let ndmi = (sample.B08 - sample.B11) / (sample.B08 + sample.B11);
  
  if (ndmi > 0.4) return [0, 0, 1];        
  if (ndmi > 0.2) return [0.2, 0.4, 0.9];  
  if (ndmi > 0) return [0.5, 0.7, 0.8];    
  if (ndmi > -0.2) return [0.8, 0.8, 0.4]; 
  return [0.9, 0.6, 0.2];                  
}`
