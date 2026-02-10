export function trackFacebookAddPaymentInfo(amount: number, currency = "BRL") {
  if (typeof window === "undefined") return

  try {
    if ((window as any).fbq) {
      (window as any).fbq("track", "AddPaymentInfo", {
        content_name: "Pagamento PIX",
        value: amount,
        currency: currency,
      })
      console.log("[FACEBOOK] ✅ AddPaymentInfo tracked:", { amount, currency })
    } else {
      console.warn("[FACEBOOK] ⚠️ Facebook Pixel não carregado")
    }
  } catch (error) {
    console.error("[FACEBOOK] ❌ Erro ao trackear AddPaymentInfo:", error)
  }
}

export function trackFacebookAddToCart(value: number, currency = "BRL", contentName?: string) {
  if (typeof window === "undefined") return

  try {
    if ((window as any).fbq) {
      (window as any).fbq("track", "AddToCart", {
        value: value,
        currency: currency,
        content_name: contentName,
      })
      console.log("[FACEBOOK] ✅ AddToCart tracked:", { value, currency, contentName })
    } else {
      console.warn("[FACEBOOK] ⚠️ Facebook Pixel não carregado")
    }
  } catch (error) {
    console.error("[FACEBOOK] ❌ Erro ao trackear AddToCart:", error)
  }
}

export function trackFacebookViewContent(contentName: string, value: number, currency = "BRL") {
  if (typeof window === "undefined") return

  try {
    if ((window as any).fbq) {
      (window as any).fbq("track", "ViewContent", {
        content_name: contentName,
        value: value,
        currency: currency,
      })
      console.log("[FACEBOOK] ✅ ViewContent tracked:", { contentName, value, currency })
    } else {
      console.warn("[FACEBOOK] ⚠️ Facebook Pixel não carregado")
    }
  } catch (error) {
    console.error("[FACEBOOK] ❌ Erro ao trackear ViewContent:", error)
  }
}

export function trackFacebookInitiateCheckout(value: number, currency = "BRL", numItems = 0) {
  if (typeof window === "undefined") return

  try {
    if ((window as any).fbq) {
      (window as any).fbq("track", "InitiateCheckout", {
        value: value,
        currency: currency,
        num_items: numItems,
      })
      console.log("[FACEBOOK] ✅ InitiateCheckout tracked:", { value, currency, numItems })
    } else {
      console.warn("[FACEBOOK] ⚠️ Facebook Pixel não carregado")
    }
  } catch (error) {
    console.error("[FACEBOOK] ❌ Erro ao trackear InitiateCheckout:", error)
  }
}

export function trackFacebookPurchase(
  value: number,
  currency = "BRL",
  transactionId?: string,
  contents?: Array<{ id: string; quantity: number }>
) {
  if (typeof window === "undefined") return

  try {
    if ((window as any).fbq) {
      const purchaseData: any = {
        value: value,
        currency: currency,
      }

      if (transactionId) {
        purchaseData.content_ids = [transactionId]
      }

      if (contents && contents.length > 0) {
        purchaseData.contents = contents
      }

      ;(window as any).fbq("track", "Purchase", purchaseData)
      console.log("[FACEBOOK] ✅✅✅ Purchase tracked:", purchaseData)
    } else {
      console.warn("[FACEBOOK] ⚠️ Facebook Pixel não carregado")
    }
  } catch (error) {
    console.error("[FACEBOOK] ❌ Erro ao trackear Purchase:", error)
  }
}

export function trackFacebookPageView() {
  if (typeof window === "undefined") return

  try {
    if ((window as any).fbq) {
      ;(window as any).fbq("track", "PageView")
      console.log("[FACEBOOK] ✅ PageView tracked")
    } else {
      console.warn("[FACEBOOK] ⚠️ Facebook Pixel não carregado")
    }
  } catch (error) {
    console.error("[FACEBOOK] ❌ Erro ao trackear PageView:", error)
  }
}

