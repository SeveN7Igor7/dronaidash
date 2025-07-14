import { EXTERNAL_APIS, TIMEOUTS } from '@/lib/constants'
import type { GeocodeResponse, CepData, Coordinates } from '@/lib/types'

export class GeocodeService {
  static async geocodeByCep(cep: string): Promise<GeocodeResponse> {
    const cleanCep = cep.replace(/\D/g, "")

    if (cleanCep.length !== 8) {
      throw new Error("CEP deve ter 8 dígitos")
    }

    console.log(`🔍 Buscando CEP: ${cleanCep}`)

    let cepData: CepData | null = null

    // Tentar API Invertexto primeiro
    try {
      cepData = await this.fetchFromInvertexto(cleanCep)
    } catch (error) {
      console.warn("⚠️ API Invertexto falhou:", error)
      
      // Fallback para ViaCEP
      try {
        cepData = await this.fetchFromViaCep(cleanCep)
      } catch (viaCepError) {
        console.warn("⚠️ ViaCEP também falhou:", viaCepError)
        cepData = this.getCepBasicData(cleanCep)
      }
    }

    if (!cepData) {
      throw new Error("Não foi possível encontrar este CEP")
    }

    const fullAddress = this.buildFullAddress(cepData)
    const coordinates = await this.geocodeAddress(fullAddress, cepData.localidade, cepData.uf)

    return {
      lat: coordinates.lat,
      lng: coordinates.lng,
      address: fullAddress,
      cep: cepData.cep,
      details: cepData,
    }
  }

  private static async fetchFromInvertexto(cep: string): Promise<CepData> {
    const response = await fetch(
      `${EXTERNAL_APIS.INVERTEXTO.BASE_URL}/${cep}?token=${EXTERNAL_APIS.INVERTEXTO.TOKEN}`,
      {
        method: "GET",
        headers: {
          "User-Agent": "AgroTrace/1.0",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(TIMEOUTS.GEOCODE),
      }
    )

    if (!response.ok) {
      throw new Error(`API Invertexto retornou: ${response.status}`)
    }

    const data = await response.json()

    if (data.error || !data.cep) {
      throw new Error("CEP não encontrado na API Invertexto")
    }

    return {
      cep: data.cep,
      logradouro: data.street || "",
      bairro: data.neighborhood || "",
      localidade: data.city || "",
      uf: data.state || "",
      complemento: data.complement || "",
      ibge: data.ibge || "",
    }
  }

  private static async fetchFromViaCep(cep: string): Promise<CepData> {
    const response = await fetch(`${EXTERNAL_APIS.VIACEP.BASE_URL}/${cep}/json/`, {
      method: "GET",
      headers: {
        "User-Agent": "AgroTrace/1.0",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(TIMEOUTS.GEOCODE),
    })

    if (!response.ok) {
      throw new Error(`ViaCEP retornou: ${response.status}`)
    }

    const data = await response.json()

    if (data.erro) {
      throw new Error("CEP não encontrado no ViaCEP")
    }

    return {
      cep: data.cep,
      logradouro: data.logradouro || "",
      bairro: data.bairro || "",
      localidade: data.localidade || "",
      uf: data.uf || "",
      complemento: data.complemento || "",
      ibge: data.ibge || "",
    }
  }

  private static getCepBasicData(cep: string): CepData {
    const cepNum = parseInt(cep)
    const cepRanges = [
      { min: 1000000, max: 19999999, uf: "SP", cidade: "São Paulo" },
      { min: 20000000, max: 28999999, uf: "RJ", cidade: "Rio de Janeiro" },
      { min: 30000000, max: 39999999, uf: "MG", cidade: "Belo Horizonte" },
      // ... outros ranges
    ]

    const range = cepRanges.find(r => cepNum >= r.min && cepNum <= r.max)

    return {
      cep: cep,
      logradouro: "",
      bairro: "",
      localidade: range?.cidade || "São Paulo",
      uf: range?.uf || "SP",
      complemento: "",
      ibge: "",
    }
  }

  private static buildFullAddress(cepData: CepData): string {
    const addressParts = [
      cepData.logradouro || "",
      cepData.bairro || "",
      cepData.localidade || "",
      cepData.uf || "",
      "Brasil",
    ].filter(Boolean)

    return addressParts.join(", ")
  }

  private static async geocodeAddress(
    fullAddress: string, 
    city: string, 
    state: string
  ): Promise<Coordinates> {
    // Tentar Google Maps se disponível
    const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (googleMapsKey) {
      try {
        const encodedAddress = encodeURIComponent(fullAddress)
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${googleMapsKey}`

        const response = await fetch(url, {
          signal: AbortSignal.timeout(TIMEOUTS.GEOCODE),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.status === "OK" && data.results?.length > 0) {
            const location = data.results[0].geometry.location
            return { lat: location.lat, lng: location.lng }
          }
        }
      } catch (error) {
        console.warn("⚠️ Google Maps geocoding falhou:", error)
      }
    }

    // Fallback para Nominatim
    try {
      const query = `${city}, ${state}, Brasil`
      const encodedQuery = encodeURIComponent(query)
      const url = `${EXTERNAL_APIS.NOMINATIM.BASE_URL}?format=json&q=${encodedQuery}&limit=1&countrycodes=br`

      const response = await fetch(url, {
        headers: {
          "User-Agent": "AgroTrace/1.0 (contato@agrotrace.com)",
        },
        signal: AbortSignal.timeout(TIMEOUTS.GEOCODE),
      })

      if (response.ok) {
        const data = await response.json()
        if (data?.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          }
        }
      }
    } catch (error) {
      console.warn("⚠️ Nominatim geocoding falhou:", error)
    }

    // Fallback para coordenadas por estado
    return this.getStateCoordinates(state)
  }

  private static getStateCoordinates(uf: string): Coordinates {
    const stateCoords: { [key: string]: Coordinates } = {
      AC: { lat: -9.0238, lng: -70.812 },
      AL: { lat: -9.5713, lng: -36.782 },
      // ... outros estados
      SP: { lat: -23.5505, lng: -46.6333 },
    }

    return stateCoords[uf] || { lat: -15.7942, lng: -47.8822 }
  }
}