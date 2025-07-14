"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Coordinates } from "@/lib/types"

interface CepFormProps {
  onLocationFound: (coords: Coordinates) => void
}

export function CepForm({ onLocationFound }: CepFormProps) {
  const [cep, setCep] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!cep) {
      toast({
        title: "⚠️ CEP obrigatório",
        description: "Por favor, digite o CEP da sua fazenda",
        variant: "destructive",
      })
      return
    }

    const cleanCep = cep.replace(/\D/g, "")

    if (cleanCep.length !== 8) {
      toast({
        title: "⚠️ CEP inválido",
        description: "O CEP deve ter 8 números (ex: 12345678)",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/geocode?cep=${cleanCep}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      onLocationFound({ lat: data.lat, lng: data.lng })

      toast({
        title: "✅ CEP encontrado!",
        description: `Localização: ${data.details.localidade}, ${data.details.uf}`,
      })
    } catch (error) {
      console.error("❌ Erro ao buscar CEP:", error)

      let errorMessage = "Erro ao buscar CEP. Tente novamente."

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "Tempo limite esgotado. Verifique sua conexão."
        } else if (error.message.includes("fetch failed")) {
          errorMessage = "Erro de conexão. Verifique sua internet."
        } else if (error.message.includes("não encontrado")) {
          errorMessage = "CEP não encontrado. Verifique se digitou corretamente."
        } else {
          errorMessage = error.message
        }
      }

      toast({
        title: "❌ Erro ao buscar CEP",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          <span className="text-lg sm:text-xl">📍 Onde fica sua fazenda?</span>
        </CardTitle>
        <CardDescription>Digite o CEP da sua propriedade para começar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cep">CEP da Fazenda</Label>
          <Input
            id="cep"
            placeholder="12345-678 ou 12345678"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            maxLength={9}
            disabled={isLoading}
            className="text-base"
          />
          <p className="text-xs text-gray-500">💡 Digite apenas os números ou com traço</p>
        </div>
        <Button onClick={handleSubmit} className="w-full text-base" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Buscando CEP...
            </>
          ) : (
            <>🔍 Buscar Localização</>
          )}
        </Button>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
          <p className="text-xs text-blue-700 font-medium mb-1">💡 Dicas se der erro:</p>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>• Verifique sua conexão com a internet</li>
            <li>• Confirme se o CEP está correto</li>
            <li>• Tente novamente em alguns segundos</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}