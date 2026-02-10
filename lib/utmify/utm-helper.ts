export interface UTMParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  src?: string
  sck?: string
}

/**
 * Obtém os parâmetros UTM salvos no localStorage
 */
export function getUTMParams(): UTMParams {
  if (typeof window === "undefined") return {}

  try {
    const utmParamsStr = localStorage.getItem("panini_utm_params")
    console.log("[UTMIFY] 📖 Lendo UTM params do localStorage:", utmParamsStr)
    if (utmParamsStr) {
      const params = JSON.parse(utmParamsStr)
      console.log("[UTMIFY] ✅ UTM params parseados:", params)
      return params
    }
  } catch (error) {
    console.error("[UTMIFY] ❌ Erro ao obter UTM params:", error)
  }

  console.log("[UTMIFY] ⚠️ Nenhum UTM param encontrado no localStorage")
  return {}
}

/**
 * Salva os parâmetros UTM no localStorage
 */
export function saveUTMParams(params: UTMParams): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("panini_utm_params", JSON.stringify(params))
    console.log("[UTMIFY] 💾 UTM params salvos:", params)
  } catch (error) {
    console.error("[UTMIFY] ❌ Erro ao salvar UTM params:", error)
  }
}

/**
 * Extrai parâmetros UTM da URL atual
 */
export function extractUTMFromURL(): UTMParams {
  if (typeof window === "undefined") return {}

  const urlParams = new URLSearchParams(window.location.search)
  const utmData: UTMParams = {
    utm_source: urlParams.get("utm_source") || undefined,
    utm_medium: urlParams.get("utm_medium") || undefined,
    utm_campaign: urlParams.get("utm_campaign") || undefined,
    utm_content: urlParams.get("utm_content") || undefined,
    utm_term: urlParams.get("utm_term") || undefined,
    src: urlParams.get("src") || undefined,
    sck: urlParams.get("sck") || undefined,
  }

  // Remove undefined values
  Object.keys(utmData).forEach((key) => {
    if (utmData[key as keyof UTMParams] === undefined) {
      delete utmData[key as keyof UTMParams]
    }
  })

  return utmData
}

/**
 * Inicializa o tracking UTM - captura da URL e salva no localStorage
 */
export function initializeUTMTracking(): void {
  if (typeof window === "undefined") return

  const urlParams = extractUTMFromURL()
  
  // Se há parâmetros UTM na URL, salva no localStorage
  if (Object.keys(urlParams).length > 0) {
    saveUTMParams(urlParams)
  } else {
    // Se não há na URL, tenta recuperar do localStorage
    const savedParams = getUTMParams()
    if (Object.keys(savedParams).length > 0) {
      console.log("[UTMIFY] ✅ Usando UTM params salvos anteriormente")
    }
  }
}

/**
 * Adiciona parâmetros UTM a uma URL
 * Preserva os UTM params em todas as navegações
 * Retorna apenas path + query string para uso com Next.js router
 */
export function buildURLWithUTM(baseUrl: string, params?: Record<string, string>): string {
  if (typeof window === "undefined") {
    // Server-side: apenas adiciona params fornecidos
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.set(key, value)
      })
      const separator = baseUrl.includes("?") ? "&" : "?"
      return `${baseUrl}${separator}${searchParams.toString()}`
    }
    return baseUrl
  }

  try {
    const utmParams = getUTMParams()
    const searchParams = new URLSearchParams()
    
    // Primeiro, adiciona os params fornecidos (têm prioridade)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          searchParams.set(key, value)
        }
      })
    }
    
    // Depois, adiciona UTM params salvos (se não existirem já)
    if (utmParams.utm_source && !searchParams.has("utm_source")) {
      searchParams.set("utm_source", utmParams.utm_source)
    }
    if (utmParams.utm_medium && !searchParams.has("utm_medium")) {
      searchParams.set("utm_medium", utmParams.utm_medium)
    }
    if (utmParams.utm_campaign && !searchParams.has("utm_campaign")) {
      searchParams.set("utm_campaign", utmParams.utm_campaign)
    }
    if (utmParams.utm_content && !searchParams.has("utm_content")) {
      searchParams.set("utm_content", utmParams.utm_content)
    }
    if (utmParams.utm_term && !searchParams.has("utm_term")) {
      searchParams.set("utm_term", utmParams.utm_term)
    }
    if (utmParams.src && !searchParams.has("src")) {
      searchParams.set("src", utmParams.src)
    }
    if (utmParams.sck && !searchParams.has("sck")) {
      searchParams.set("sck", utmParams.sck)
    }
    
    // Constrói a URL final
    const separator = baseUrl.includes("?") ? "&" : "?"
    const queryString = searchParams.toString()
    
    if (queryString) {
      return `${baseUrl}${separator}${queryString}`
    }
    
    return baseUrl
  } catch (error) {
    console.error("[UTMIFY] ❌ Erro ao construir URL com UTM:", error)
    // Fallback: retorna URL original
    return baseUrl
  }
}

/**
 * Hook para usar em navegações - preserva UTM params automaticamente
 */
export function useUTMNavigation() {
  if (typeof window === "undefined") {
    return {
      navigate: (url: string, params?: Record<string, string>) => url,
    }
  }

  return {
    navigate: (baseUrl: string, params?: Record<string, string>) => {
      return buildURLWithUTM(baseUrl, params)
    },
  }
}

