export function trackFacebookAddPaymentInfo(amount: number, currency = "BRL") {
  if (typeof window === "undefined") return

  try {
    if (window.fbq) {
      window.fbq("track", "AddPaymentInfo", {
        content_name: "Pagamento PIX",
        value: amount,
        currency: currency,
      })
    }
  } catch (error) {
    console.error("[v0] Erro ao trackear AddPaymentInfo:", error)
  }
}

export function trackFacebookAddToCart(value: number, currency = "BRL") {
  if (typeof window === "undefined") return

  try {
    if (window.fbq) {
      window.fbq("track", "AddToCart", {
        value: value,
        currency: currency,
      })
    }
  } catch (error) {
    console.error("[v0] Erro ao trackear AddToCart:", error)
  }
}

export function trackFacebookViewContent(contentName: string, value: number, currency = "BRL") {
  if (typeof window === "undefined") return

  try {
    if (window.fbq) {
      window.fbq("track", "ViewContent", {
        content_name: contentName,
        value: value,
        currency: currency,
      })
    }
  } catch (error) {
    console.error("[v0] Erro ao trackear ViewContent:", error)
  }
}

export function trackFacebookInitiateCheckout(value: number, currency = "BRL", numItems = 0) {
  if (typeof window === "undefined") return

  try {
    if (window.fbq) {
      window.fbq("track", "InitiateCheckout", {
        value: value,
        currency: currency,
        num_items: numItems,
      })
      console.log("[v0] Facebook InitiateCheckout tracked:", { value, currency, numItems })
    }
  } catch (error) {
    console.error("[v0] Erro ao trackear InitiateCheckout:", error)
  }
}

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
  }
}
