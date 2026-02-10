"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { getUTMParams, type UTMParams, extractUTMFromURL, saveUTMParams } from "@/lib/utmify/utm-helper"

/**
 * Hook para obter e gerenciar parâmetros UTM
 */
export function useUTMTracking() {
  const [utmParams, setUtmParams] = useState<UTMParams>({})

  useEffect(() => {
    // Carrega UTM params do localStorage
    const params = getUTMParams()
    setUtmParams(params)
  }, [])

  return utmParams
}

/**
 * Hook para rastrear eventos de visualização de página
 */
export function usePageViewTracking(pageName: string) {
  useEffect(() => {
    if (typeof window === "undefined") return

    const utmParams = getUTMParams()
    
    console.log(`[UTMIFY] 📊 Page View: ${pageName}`, {
      utmParams,
      url: window.location.href,
    })

    // Aqui você pode enviar eventos customizados se necessário
    // Por exemplo, para Google Analytics ou outros trackers
  }, [pageName])
}

/**
 * Hook para preservar UTM params na URL e no localStorage
 * Garante que os UTM params sejam mantidos em todas as páginas
 */
export function usePreserveUTMParams() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined") return

    // Extrai UTM params da URL atual
    const urlUtmParams = extractUTMFromURL()
    
    // Se há UTM params na URL, salva no localStorage
    if (Object.keys(urlUtmParams).length > 0) {
      saveUTMParams(urlUtmParams)
      console.log("[UTMIFY] ✅ UTM params salvos da URL:", urlUtmParams)
    } else {
      // Se não há na URL, tenta recuperar do localStorage e adiciona à URL
      const savedUtmParams = getUTMParams()
      if (Object.keys(savedUtmParams).length > 0) {
        // Get current URL params from window.location instead of searchParams
        const currentUrlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")
        let needsUpdate = false

        // Adiciona UTM params salvos se não estiverem na URL
        if (savedUtmParams.utm_source && !currentUrlParams.has("utm_source")) {
          currentUrlParams.set("utm_source", savedUtmParams.utm_source)
          needsUpdate = true
        }
        if (savedUtmParams.utm_medium && !currentUrlParams.has("utm_medium")) {
          currentUrlParams.set("utm_medium", savedUtmParams.utm_medium)
          needsUpdate = true
        }
        if (savedUtmParams.utm_campaign && !currentUrlParams.has("utm_campaign")) {
          currentUrlParams.set("utm_campaign", savedUtmParams.utm_campaign)
          needsUpdate = true
        }
        if (savedUtmParams.utm_content && !currentUrlParams.has("utm_content")) {
          currentUrlParams.set("utm_content", savedUtmParams.utm_content)
          needsUpdate = true
        }
        if (savedUtmParams.utm_term && !currentUrlParams.has("utm_term")) {
          currentUrlParams.set("utm_term", savedUtmParams.utm_term)
          needsUpdate = true
        }
        if (savedUtmParams.src && !currentUrlParams.has("src")) {
          currentUrlParams.set("src", savedUtmParams.src)
          needsUpdate = true
        }
        if (savedUtmParams.sck && !currentUrlParams.has("sck")) {
          currentUrlParams.set("sck", savedUtmParams.sck)
          needsUpdate = true
        }

        // Atualiza a URL se necessário (sem recarregar a página)
        if (needsUpdate) {
          const newUrl = `${pathname}?${currentUrlParams.toString()}`
          router.replace(newUrl, { scroll: false })
          console.log("[UTMIFY] ✅ UTM params restaurados na URL:", savedUtmParams)
        }
      }
    }
  }, [pathname, searchParams, router])
}

