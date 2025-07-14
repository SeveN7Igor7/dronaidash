"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapIcon, Satellite, Loader2 } from "lucide-react"
import { MapComponent } from "./map-component"
import type { Coordinates } from "@/lib/types"

interface MapSelectorProps {
  coordinates: Coordinates
  onLocationSelect: (coords: Coordinates) => void
  onAnalyze: () => void
  onBack: () => void
  isAnalyzing: boolean
}

export function MapSelector({ 
  coordinates, 
  onLocationSelect, 
  onAnalyze, 
  onBack, 
  isAnalyzing 
}: MapSelectorProps) {
  return (
    <div className="space-y-6">
      <Card className="mx-4 sm:mx-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="h-5 w-5" />
            <span className="text-lg sm:text-xl">🗺️ Ajustar Localização da Fazenda</span>
          </CardTitle>
          <CardDescription className="text-sm">
            Mova o marcador vermelho para a posição exata da sua fazenda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MapComponent 
            initialCoordinates={coordinates} 
            onLocationSelect={onLocationSelect} 
          />
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
        <Button variant="outline" onClick={onBack} size="lg" className="w-full sm:w-auto">
          ← Voltar
        </Button>
        <Button 
          onClick={onAnalyze} 
          disabled={isAnalyzing} 
          className="w-full sm:min-w-40 sm:w-auto" 
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Satellite className="h-4 w-4 mr-2" />
              🚀 Analisar Fazenda
            </>
          )}
        </Button>
      </div>

      {isAnalyzing && (
        <Card className="border-blue-200 bg-blue-50 mx-4 sm:mx-0">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-600" />
              <h3 className="font-semibold text-blue-900 mb-2">🛰️ Processando dados do satélite...</h3>
              <p className="text-sm text-blue-700 mb-3">
                Estamos baixando e analisando imagens de alta resolução. Isso pode demorar até 2 minutos.
              </p>
              <div className="text-xs text-blue-600 space-y-1 text-left sm:text-center">
                <p>• Conectando com Sentinel Hub</p>
                <p>• Baixando 7 tipos de imagens diferentes</p>
                <p>• Processando dados espectrais</p>
                <p>• Gerando análise com IA</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}