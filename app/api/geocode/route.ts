import { type NextRequest, NextResponse } from "next/server"
import { GeocodeService } from "@/services/geocode"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const cep = searchParams.get("cep")

  if (!cep) {
    return NextResponse.json({ error: "CEP é obrigatório" }, { status: 400 })
  }

  try {
    const result = await GeocodeService.geocodeByCep(cep)
    return NextResponse.json(result)
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
