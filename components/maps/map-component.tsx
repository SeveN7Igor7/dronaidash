"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Navigation, Search, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Coordinates } from "@/lib/types"

interface MapComponentProps {
  initialCoordinates: Coordinates
  onLocationSelect: (coords: Coordinates) => void
}

// Declaração global para Leaflet
declare global {
  interface Window {
    L: any
  }
}

export function MapComponent({ initialCoordinates, onLocationSelect }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [currentCoords, setCurrentCoords] = useState(initialCoordinates)
  const [isLoading, setIsLoading] = useState(true)
  const [searchAddress, setSearchAddress] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  // Função para carregar Leaflet
  const loadLeaflet = useCallback(() => {
    if (typeof window !== "undefined" && !window.L && !leafletLoaded) {
      setLeafletLoaded(true)

      // Carregar CSS do Leaflet
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      link.onload = () => {
        // Carregar JS do Leaflet após CSS
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.onload = () => {
          setTimeout(initializeMap, 100) // Pequeno delay para garantir que tudo carregou
        }
        script.onerror = () => {
          setIsLoading(false)
          toast({
            title: "❌ Erro ao carregar mapa",
            description: "Não foi possível carregar o sistema de mapas",
            variant: "destructive",
          })
        }
        document.head.appendChild(script)
      }
      document.head.appendChild(link)
    } else if (window.L) {
      initializeMap()
    }
  }, [])

  // Função para inicializar o mapa
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.L || mapInstanceRef.current) return

    try {
      console.log("🗺️ Inicializando mapa...")

      // Limpar container se necessário
      if (mapRef.current) {
        mapRef.current.innerHTML = ""
      }

      // Criar o mapa
      const leafletMap = window.L.map(mapRef.current, {
        center: [initialCoordinates.lat, initialCoordinates.lng],
        zoom: 15,
        zoomControl: true,
        attributionControl: true,
      })

      // Adicionar camada de satélite
      window.L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "© Esri, Maxar, Earthstar Geographics",
          maxZoom: 18,
        },
      ).addTo(leafletMap)

      // Adicionar marcador
      const leafletMarker = window.L.marker([initialCoordinates.lat, initialCoordinates.lng], {
        draggable: true,
      }).addTo(leafletMap)

      leafletMarker.bindPopup("📍 Localização da sua fazenda<br>Arraste para mover").openPopup()

      // Evento de clique no mapa
      leafletMap.on("click", (e: any) => {
        const newCoords = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        }
        leafletMarker.setLatLng([newCoords.lat, newCoords.lng])
        setCurrentCoords(newCoords)
        onLocationSelect(newCoords)

        toast({
          title: "📍 Localização atualizada",
          description: "Nova posição selecionada no mapa",
        })
      })

      // Evento de arrastar marcador
      leafletMarker.on("dragend", (e: any) => {
        const position = e.target.getLatLng()
        const newCoords = {
          lat: position.lat,
          lng: position.lng,
        }
        setCurrentCoords(newCoords)
        onLocationSelect(newCoords)

        toast({
          title: "📍 Marcador movido",
          description: "Posição da fazenda atualizada",
        })
      })

      // Salvar referências
      mapInstanceRef.current = leafletMap
      markerRef.current = leafletMarker
      setIsLoading(false)

      console.log("✅ Mapa inicializado com sucesso")
      toast({
        title: "🗺️ Mapa carregado",
        description: "Clique no mapa ou arraste o marcador vermelho",
      })
    } catch (error) {
      console.error("❌ Erro ao inicializar mapa:", error)
      setIsLoading(false)
      toast({
        title: "❌ Erro no mapa",
        description: "Não foi possível carregar o mapa. Tente recarregar a página.",
        variant: "destructive",
      })
    }
  }, [initialCoordinates, onLocationSelect])

  // Effect para carregar o mapa
  useEffect(() => {
    loadLeaflet()

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
          markerRef.current = null
        } catch (error) {
          console.log("Erro ao limpar mapa:", error)
        }
      }
    }
  }, [loadLeaflet])

  // Função para obter localização atual
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "❌ GPS não disponível",
        description: "Seu dispositivo não tem GPS ou não permitiu acesso",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([newCoords.lat, newCoords.lng], 16)
          markerRef.current.setLatLng([newCoords.lat, newCoords.lng])
          setCurrentCoords(newCoords)
          onLocationSelect(newCoords)
        }

        setIsSearching(false)
        toast({
          title: "📍 Localização encontrada",
          description: "Marcador movido para onde você está agora",
        })
      },
      (error) => {
        setIsSearching(false)
        let errorMessage = "Não conseguimos encontrar sua localização"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Você precisa permitir acesso à localização"
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Localização não disponível no momento"
            break
          case error.TIMEOUT:
            errorMessage = "Tempo limite para encontrar localização"
            break
        }

        toast({
          title: "❌ Erro de localização",
          description: errorMessage,
          variant: "destructive",
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      },
    )
  }

  // Função para buscar endereço
  const searchLocation = async () => {
    if (!searchAddress.trim()) {
      toast({
        title: "⚠️ Digite um endereço",
        description: "Escreva o nome da cidade ou endereço para buscar",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    try {
      console.log("🔍 Buscando:", searchAddress)

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress + ", Brasil")}&limit=1&countrycodes=br`,
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const newCoords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        }

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([newCoords.lat, newCoords.lng], 15)
          markerRef.current.setLatLng([newCoords.lat, newCoords.lng])
          setCurrentCoords(newCoords)
          onLocationSelect(newCoords)
        }

        const locationName = data[0].display_name.split(",").slice(0, 3).join(", ")
        toast({
          title: "📍 Endereço encontrado",
          description: locationName,
        })
      } else {
        toast({
          title: "❌ Endereço não encontrado",
          description: "Tente um endereço mais específico ou nome de cidade",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro na busca:", error)
      toast({
        title: "❌ Erro na busca",
        description: "Não conseguimos buscar o endereço. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de busca */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Digite o nome da cidade ou endereço..."
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && searchLocation()}
          className="flex-1 text-base"
          disabled={isSearching}
        />
        <Button onClick={searchLocation} disabled={isSearching || !searchAddress.trim()} className="w-full sm:w-auto">
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {/* Informações da localização */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-green-50 p-3 rounded-lg gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-green-700">
          <MapPin className="h-4 w-4" />
          <span>
            📍 Lat: {currentCoords.lat.toFixed(4)}, Lng: {currentCoords.lng.toFixed(4)}
          </span>
        </div>
        <Button onClick={getCurrentLocation} variant="outline" size="sm" disabled={isSearching} className="w-full sm:w-auto">
          {isSearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Navigation className="h-4 w-4 mr-2" />}
          Onde estou
        </Button>
      </div>

      {/* Container do mapa */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white rounded-lg flex items-center justify-center z-10 border-2 border-green-200">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-green-600" />
              <p className="text-sm text-gray-600 font-medium">Carregando mapa...</p>
              <p className="text-xs text-gray-500 mt-1">Aguarde alguns segundos</p>
            </div>
          </div>
        )}

        <div
          ref={mapRef}
          className="w-full h-64 sm:h-96 rounded-lg border-2 border-green-200 bg-gray-100"
          style={{ minHeight: "300px" }}
        />
      </div>

      {/* Instruções */}
      <div className="text-center bg-blue-50 p-4 rounded-lg">
        <p className="text-xs sm:text-sm text-blue-700 font-medium mb-1">🗺️ Como usar o mapa:</p>
        <div className="text-xs text-blue-600 space-y-1 text-left sm:text-center">
          <p>• Clique em qualquer lugar do mapa para marcar sua fazenda</p>
          <p>• Arraste o marcador vermelho para ajustar a posição</p>
          <p>• Use "Onde estou" para ir para sua localização atual</p>
          <p>• Digite uma cidade na busca para ir para lá</p>
        </div>
      </div>
    </div>
  )
}