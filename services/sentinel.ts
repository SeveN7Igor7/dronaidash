import { SENTINEL_CONFIG, IMAGE_CONFIG, TIMEOUTS } from '@/lib/constants'

export class SentinelService {
  static async getToken(): Promise<string> {
    const params = new URLSearchParams()
    params.append("grant_type", "client_credentials")
    params.append("client_id", SENTINEL_CONFIG.CLIENT_ID)
    params.append("client_secret", SENTINEL_CONFIG.CLIENT_SECRET)

    const response = await fetch(SENTINEL_CONFIG.TOKEN_URL, {
      method: "POST",
      body: params,
      signal: AbortSignal.timeout(TIMEOUTS.API_REQUEST),
    })

    const data = await response.json()
    return data.access_token
  }

  static getDateRange(daysBack = IMAGE_CONFIG.DAYS_BACK) {
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

  static async downloadImage(
    accessToken: string,
    timeRange: any,
    bbox: number[],
    evalscript: string,
    formatType: string
  ): Promise<ArrayBuffer> {
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
              maxCloudCoverage: IMAGE_CONFIG.MAX_CLOUD_COVERAGE,
            },
          },
        ],
      },
      output: {
        width: IMAGE_CONFIG.WIDTH,
        height: IMAGE_CONFIG.HEIGHT,
        responses: [
          {
            identifier: "default",
            format: { type: formatType },
          },
        ],
      },
      evalscript,
    }

    const response = await fetch(SENTINEL_CONFIG.PROCESS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: formatType === "image/tiff" ? "application/octet-stream" : formatType,
      },
      signal: AbortSignal.timeout(TIMEOUTS.IMAGE_DOWNLOAD),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Erro ${response.status}:`, errorText)
      throw new Error(`Erro ao baixar imagem: ${response.status}`)
    }

    return await response.arrayBuffer()
  }
}