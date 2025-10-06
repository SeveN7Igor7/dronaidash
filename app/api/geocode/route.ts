import { type NextRequest, NextResponse } from "next/server"

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const INVERTEXTO_TOKEN = "20193|uBrkjYHKhh6hmPLivBR8H3ZUZ9K78U7H"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const cep = searchParams.get("cep")

  if (!cep) {
    return NextResponse.json({ error: "CEP é obrigatório" }, { status: 400 })
  }

  try {
    // Remove formatação do CEP
    const cleanCep = cep.replace(/\D/g, "")

    if (cleanCep.length !== 8) {
      return NextResponse.json({ error: "CEP deve ter 8 dígitos" }, { status: 400 })
    }

    console.log(`🔍 Buscando CEP: ${cleanCep}`)

    // Buscar CEP usando API Invertexto
    let cepData = null

    try {
      console.log("📡 Tentando API Invertexto...")
      const invertextoResponse = await fetch(
        `https://api.invertexto.com/v1/cep/${cleanCep}?token=${INVERTEXTO_TOKEN}`,
        {
          method: "GET",
          headers: {
            "User-Agent": "AgroTrace/1.0",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(10000), // 10 segundos timeout
        },
      )

      if (invertextoResponse.ok) {
        const invertextoData = await invertextoResponse.json()
        console.log("✅ API Invertexto respondeu:", invertextoData)

        // Verificar se há erro na resposta
        if (invertextoData.error || !invertextoData.cep) {
          throw new Error("CEP não encontrado na API Invertexto")
        }

        // Converter formato da API Invertexto para o formato esperado
        cepData = {
          cep: invertextoData.cep,
          logradouro: invertextoData.street || "",
          bairro: invertextoData.neighborhood || "",
          localidade: invertextoData.city || "",
          uf: invertextoData.state || "",
          complemento: invertextoData.complement || "",
          ibge: invertextoData.ibge || "",
        }
      } else {
        throw new Error(`API Invertexto retornou: ${invertextoResponse.status}`)
      }
    } catch (invertextoError) {
      console.warn("⚠️ API Invertexto falhou:", invertextoError)

      // Fallback: Tentar ViaCEP como alternativa
      try {
        console.log("📡 Tentando ViaCEP como fallback...")
        const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
          method: "GET",
          headers: {
            "User-Agent": "AgroTrace/1.0",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(10000),
        })

        if (viaCepResponse.ok) {
          const viaCepData = await viaCepResponse.json()
          console.log("✅ ViaCEP respondeu como fallback:", viaCepData)

          if (viaCepData.erro) {
            throw new Error("CEP não encontrado no ViaCEP")
          }

          // Converter formato ViaCEP para o formato esperado
          cepData = {
            cep: viaCepData.cep,
            logradouro: viaCepData.logradouro || "",
            bairro: viaCepData.bairro || "",
            localidade: viaCepData.localidade || "",
            uf: viaCepData.uf || "",
            complemento: viaCepData.complemento || "",
            ibge: viaCepData.ibge || "",
          }
        } else {
          throw new Error(`ViaCEP retornou: ${viaCepResponse.status}`)
        }
      } catch (viaCepError) {
        console.warn("⚠️ ViaCEP também falhou:", viaCepError)

        // Último fallback: Usar dados básicos do CEP
        console.log("📡 Usando dados básicos do CEP...")
        cepData = await getCepBasicData(cleanCep)
      }
    }

    if (!cepData) {
      return NextResponse.json({ error: "Não foi possível encontrar este CEP" }, { status: 404 })
    }

    // Monta o endereço completo
    const addressParts = [
      cepData.logradouro || "",
      cepData.bairro || "",
      cepData.localidade || "",
      cepData.uf || "",
      "Brasil",
    ].filter(Boolean)

    const fullAddress = addressParts.join(", ")

    console.log(`📍 Endereço montado: ${fullAddress}`)

    // Geocodifica usando múltiplas APIs
    const coordinates = await geocodeAddress(fullAddress, cepData.localidade, cepData.uf)

    return NextResponse.json({
      lat: coordinates.lat,
      lng: coordinates.lng,
      address: fullAddress,
      cep: cepData.cep,
      details: {
        logradouro: cepData.logradouro || "",
        bairro: cepData.bairro || "",
        localidade: cepData.localidade || "",
        uf: cepData.uf || "",
        complemento: cepData.complemento || "",
        ibge: cepData.ibge || "",
      },
    })
  } catch (error) {
    console.error("❌ Erro geral ao buscar CEP:", error)
    return NextResponse.json(
      {
        error: "Erro ao buscar CEP. Tente novamente em alguns segundos.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

// Função para obter dados básicos do CEP baseado na região
async function getCepBasicData(cep: string) {
  const cepNum = Number.parseInt(cep)

  // Mapeamento básico de faixas de CEP para estados/regiões
  const cepRanges = [
    { min: 1000000, max: 19999999, uf: "SP", cidade: "São Paulo" },
    { min: 20000000, max: 28999999, uf: "RJ", cidade: "Rio de Janeiro" },
    { min: 30000000, max: 39999999, uf: "MG", cidade: "Belo Horizonte" },
    { min: 40000000, max: 48999999, uf: "BA", cidade: "Salvador" },
    { min: 50000000, max: 56999999, uf: "PE", cidade: "Recife" },
    { min: 57000000, max: 57999999, uf: "AL", cidade: "Maceió" },
    { min: 58000000, max: 58999999, uf: "PB", cidade: "João Pessoa" },
    { min: 59000000, max: 59999999, uf: "RN", cidade: "Natal" },
    { min: 60000000, max: 63999999, uf: "CE", cidade: "Fortaleza" },
    { min: 64000000, max: 64999999, uf: "PI", cidade: "Teresina" },
    { min: 65000000, max: 65999999, uf: "MA", cidade: "São Luís" },
    { min: 69000000, max: 69999999, uf: "AC", cidade: "Rio Branco" },
    { min: 70000000, max: 72999999, uf: "DF", cidade: "Brasília" },
    { min: 73000000, max: 76999999, uf: "GO", cidade: "Goiânia" },
    { min: 77000000, max: 78999999, uf: "MT", cidade: "Cuiabá" },
    { min: 79000000, max: 79999999, uf: "MS", cidade: "Campo Grande" },
    { min: 80000000, max: 87999999, uf: "PR", cidade: "Curitiba" },
    { min: 88000000, max: 89999999, uf: "SC", cidade: "Florianópolis" },
    { min: 90000000, max: 99999999, uf: "RS", cidade: "Porto Alegre" },
  ]

  const range = cepRanges.find((r) => cepNum >= r.min && cepNum <= r.max)

  if (range) {
    return {
      cep: cep,
      logradouro: "",
      bairro: "",
      localidade: range.cidade,
      uf: range.uf,
      complemento: "",
      ibge: "",
    }
  }

  // Fallback para São Paulo se não encontrar
  return {
    cep: cep,
    logradouro: "",
    bairro: "",
    localidade: "São Paulo",
    uf: "SP",
    complemento: "",
    ibge: "",
  }
}

// Função para geocodificar endereço com múltiplas tentativas
async function geocodeAddress(fullAddress: string, city: string, state: string) {
  // Tentativa 1: Google Maps Geocoding API
  if (GOOGLE_MAPS_API_KEY) {
    try {
      console.log("📍 Tentando Google Maps Geocoding...")
      const encodedAddress = encodeURIComponent(fullAddress)
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`

      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
      })

      if (response.ok) {
        const data = await response.json()

        if (data.status === "OK" && data.results && data.results.length > 0) {
          const location = data.results[0].geometry.location
          console.log("✅ Google Maps geocoding sucesso")
          return {
            lat: location.lat,
            lng: location.lng,
          }
        }
      }
    } catch (error) {
      console.warn("⚠️ Google Maps geocoding falhou:", error)
    }
  }

  // Tentativa 2: Nominatim (OpenStreetMap)
  try {
    console.log("📍 Tentando Nominatim...")
    const query = `${city}, ${state}, Brasil`
    const encodedQuery = encodeURIComponent(query)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1&countrycodes=br`

    const response = await fetch(url, {
      headers: {
        "User-Agent": "AgroTrace/1.0 (contato@agrotrace.com)",
      },
      signal: AbortSignal.timeout(10000),
    })

    if (response.ok) {
      const data = await response.json()

      if (data && data.length > 0) {
        console.log("✅ Nominatim geocoding sucesso")
        return {
          lat: Number.parseFloat(data[0].lat),
          lng: Number.parseFloat(data[0].lon),
        }
      }
    }
  } catch (error) {
    console.warn("⚠️ Nominatim geocoding falhou:", error)
  }

  // Tentativa 3: Coordenadas aproximadas por estado
  console.log("📍 Usando coordenadas aproximadas por estado...")
  return getStateCoordinates(state)
}

// Função para obter coordenadas aproximadas por estado
function getStateCoordinates(uf: string) {
  const stateCoords: { [key: string]: { lat: number; lng: number } } = {
    AC: { lat: -9.0238, lng: -70.812 }, // Acre
    AL: { lat: -9.5713, lng: -36.782 }, // Alagoas
    AP: { lat: 0.9023, lng: -52.003 }, // Amapá
    AM: { lat: -3.4168, lng: -65.856 }, // Amazonas
    BA: { lat: -12.5797, lng: -41.7007 }, // Bahia
    CE: { lat: -5.4984, lng: -39.3206 }, // Ceará
    DF: { lat: -15.7998, lng: -47.8645 }, // Distrito Federal
    ES: { lat: -19.1834, lng: -40.3089 }, // Espírito Santo
    GO: { lat: -15.827, lng: -49.8362 }, // Goiás
    MA: { lat: -4.9609, lng: -45.2744 }, // Maranhão
    MT: { lat: -12.6819, lng: -56.9211 }, // Mato Grosso
    MS: { lat: -20.7722, lng: -54.7852 }, // Mato Grosso do Sul
    MG: { lat: -18.5122, lng: -44.555 }, // Minas Gerais
    PA: { lat: -3.9019, lng: -52.4788 }, // Pará
    PB: { lat: -7.24, lng: -36.782 }, // Paraíba
    PR: { lat: -24.89, lng: -51.55 }, // Paraná
    PE: { lat: -8.8137, lng: -36.9541 }, // Pernambuco
    PI: { lat: -8.5735, lng: -42.7654 }, // Piauí
    RJ: { lat: -22.9129, lng: -43.2003 }, // Rio de Janeiro
    RN: { lat: -5.4026, lng: -36.9541 }, // Rio Grande do Norte
    RS: { lat: -30.0346, lng: -51.2177 }, // Rio Grande do Sul
    RO: { lat: -10.9472, lng: -62.8182 }, // Rondônia
    RR: { lat: 1.99, lng: -61.33 }, // Roraima
    SC: { lat: -27.2423, lng: -50.2189 }, // Santa Catarina
    SP: { lat: -23.5505, lng: -46.6333 }, // São Paulo
    SE: { lat: -10.5741, lng: -37.3857 }, // Sergipe
    TO: { lat: -10.17, lng: -48.2982 }, // Tocantins
  }

  return stateCoords[uf] || { lat: -15.7942, lng: -47.8822 } // Centro do Brasil como fallback
}
