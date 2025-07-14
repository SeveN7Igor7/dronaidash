import { GEMINI_CONFIG, TIMEOUTS } from '@/lib/constants'
import type { Coordinates } from '@/lib/types'

export class AIService {
  static async analyzeImage(rgbBuffer: ArrayBuffer, coordinates: Coordinates) {
    if (!GEMINI_CONFIG.API_KEY) {
      return this.getFallbackAnalysis()
    }

    try {
      const base64Image = Buffer.from(rgbBuffer).toString("base64")
      const prompt = this.buildAnalysisPrompt()

      const response = await fetch(
        `${GEMINI_CONFIG.BASE_URL}?key=${GEMINI_CONFIG.API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(TIMEOUTS.API_REQUEST),
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
        }
      )

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }

      const data = await response.json()
      const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text

      if (!aiResponse) {
        throw new Error("Resposta vazia da IA")
      }

      return this.parseAIResponse(aiResponse)
    } catch (error) {
      console.error("❌ Erro na análise de IA:", error)
      return this.getFallbackAnalysis()
    }
  }

  static async generateInterpretation(
    spectralAnalysis: any,
    completeAnalysis: any,
    coordinates: Coordinates
  ): Promise<string> {
    if (!GEMINI_CONFIG.API_KEY) {
      return "Interpretação de IA não disponível"
    }

    const prompt = this.buildInterpretationPrompt(spectralAnalysis, completeAnalysis, coordinates)

    try {
      const response = await fetch(
        `${GEMINI_CONFIG.BASE_URL}?key=${GEMINI_CONFIG.API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(TIMEOUTS.API_REQUEST),
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
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

  private static buildAnalysisPrompt(): string {
    return `
Você é um especialista em agricultura e análise de imagens de satélite. Analise esta imagem detalhadamente.

TAREFAS:
1. CLASSIFICAÇÃO: É fazenda/rural ou cidade/urbana?
2. IDENTIFICAÇÃO DE CULTURAS: Se for fazenda, que tipo de plantação você vê?
3. SAÚDE DAS PLANTAS: Como está a vegetação?
4. PROBLEMAS: Vê algum problema na área?
5. PADRÕES: Descreva os padrões que identifica
6. ESTÁGIO: Se for cultura, em que estágio está?

CULTURAS POSSÍVEIS NO BRASIL:
- Soja, Milho, Cana-de-açúcar, Café, Algodão, Arroz, Feijão, Trigo
- Pastagem, Eucalipto, Citros, Banana, Tomate, Batata
- Hortaliças, Flores, Fruticultura

Responda em JSON válido com a estrutura esperada.
`
  }

  private static buildInterpretationPrompt(
    spectralAnalysis: any,
    completeAnalysis: any,
    coordinates: Coordinates
  ): string {
    return `
RELATÓRIO TÉCNICO COMPLETO - ANÁLISE AGRÍCOLA

LOCALIZAÇÃO: ${coordinates.lat}, ${coordinates.lng}
CLASSIFICAÇÃO FINAL: ${completeAnalysis.classification}
CULTURA IDENTIFICADA: ${completeAnalysis.cropType}
SCORE DE SAÚDE: ${completeAnalysis.healthScore}/100

DADOS ESPECTRAIS:
- NDVI: ${spectralAnalysis.ndvi.mean.toFixed(3)}
- EVI: ${spectralAnalysis.evi.mean.toFixed(3)}
- Umidade: ${spectralAnalysis.moisture.mean.toFixed(3)}

Gere um relatório técnico completo explicando:
1. Estado atual da fazenda
2. Problemas identificados e suas causas
3. Recomendações específicas
4. Prognóstico para próximos 30 dias
5. Ações prioritárias

Máximo 500 palavras, linguagem técnica mas acessível.
`
  }

  private static parseAIResponse(aiResponse: string) {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const aiResult = JSON.parse(jsonMatch[0])
        return this.formatAIResult(aiResult)
      } else {
        throw new Error("JSON não encontrado")
      }
    } catch (parseError) {
      console.warn("⚠️ Erro ao parsear JSON, usando análise de texto")
      return this.parseTextResponse(aiResponse)
    }
  }

  private static formatAIResult(aiResult: any) {
    return {
      classification: aiResult.classification === "urban" ? "urban_detected" : "agricultural_detected",
      confidence: Math.max(0.7, Math.min(1.0, aiResult.confidence || 0.8)),
      isUrban: aiResult.classification === "urban",
      isAgricultural: aiResult.classification === "rural",
      cropIdentification: aiResult.cropIdentification || {
        primaryCrop: "unknown",
        confidence: 0.5,
        growthStage: "unknown",
        reasoning: "Não foi possível identificar",
      },
      healthAssessment: aiResult.healthAssessment || {
        overallHealth: "regular",
        vegetationDensity: "média",
        colorPattern: "verde normal",
        uniformity: "irregular",
      },
      problemsDetected: aiResult.problemsDetected || [],
      patterns: aiResult.patterns || {},
      recommendations: aiResult.recommendations || [],
      reasoning: aiResult.reasoning || "Análise visual por IA",
      details: aiResult.details || "",
      rawResponse: JSON.stringify(aiResult),
    }
  }

  private static parseTextResponse(response: string) {
    const isUrban = response.toLowerCase().includes("urban") || response.toLowerCase().includes("cidade")
    const isRural = response.toLowerCase().includes("rural") || response.toLowerCase().includes("fazenda")

    return {
      classification: isUrban && !isRural ? "urban_detected" : "agricultural_detected",
      confidence: 0.8,
      isUrban: isUrban && !isRural,
      isAgricultural: !isUrban || isRural,
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
      rawResponse: response,
    }
  }

  private static getFallbackAnalysis() {
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
}