interface UtmifyPayload {
  orderId: string
  platform: string
  paymentMethod: "credit_card" | "boleto" | "pix" | "paypal" | "free_price"
  status: "waiting_payment" | "paid" | "refused" | "refunded" | "chargedback"
  createdAt: string
  approvedDate: string | null
  refundedAt: string | null
  customer: {
    name: string
    email: string
    phone: string | null
    document: string | null
    country?: string
    ip?: string
  }
  products: Array<{
    id: string
    name: string
    planId: string | null
    planName: string | null
    quantity: number
    priceInCents: number
  }>
  trackingParameters: {
    src: string | null
    sck: string | null
    utm_source: string | null
    utm_campaign: string | null
    utm_medium: string | null
    utm_content: string | null
    utm_term: string | null
  }
  commission: {
    totalPriceInCents: number
    gatewayFeeInCents: number
    userCommissionInCents: number
    currency?: "BRL" | "USD" | "EUR" | "GBP" | "ARS" | "CAD"
  }
  isTest?: boolean
}

export interface TransactionData {
  orderId: string
  amount: number
  customerName: string
  customerEmail: string
  customerDocument: string
  customerPhone?: string
  productName?: string
  paymentMethod?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  createdAt?: Date
  approvedAt?: Date
}

function formatDateForUtmify(date: Date): string {
  return date.toISOString().replace("T", " ").substring(0, 19)
}

function extractTrackingParameters(transaction: TransactionData): UtmifyPayload["trackingParameters"] {
  console.log("[v0] Extracting tracking parameters from transaction:", {
    utmSource: transaction.utmSource,
    utmMedium: transaction.utmMedium,
    utmCampaign: transaction.utmCampaign,
    utmContent: transaction.utmContent,
    utmTerm: transaction.utmTerm,
  })

  const utmSource = transaction.utmSource || "organic"

  const params = {
    src: utmSource,
    sck: null,
    utm_source: utmSource,
    utm_campaign: transaction.utmCampaign || null,
    utm_medium: transaction.utmMedium || null,
    utm_content: transaction.utmContent || null,
    utm_term: transaction.utmTerm || null,
  }

  console.log("[v0] Extracted tracking parameters:", params)

  return params
}

function buildUtmifyPayload(
  transaction: TransactionData,
  status: "waiting_payment" | "paid" | "refused" | "refunded" | "chargedback",
): UtmifyPayload {
  const totalAmountInCents = Math.round(transaction.amount * 100)
  const createdAt = transaction.createdAt || new Date()

  return {
    orderId: transaction.orderId,
    platform: "id-7645 Premiada",
    paymentMethod: "pix",
    status: status,
    createdAt: formatDateForUtmify(createdAt),
    approvedDate:
      status === "paid" && transaction.approvedAt
        ? formatDateForUtmify(transaction.approvedAt)
        : status === "paid"
          ? formatDateForUtmify(new Date())
          : null,
    refundedAt: status === "refunded" ? formatDateForUtmify(new Date()) : null,
    customer: {
      name: transaction.customerName || "",
      email: transaction.customerEmail || "",
      phone: transaction.customerPhone || null,
      document: transaction.customerDocument || null,
      country: "BR",
    },
    products: [
      {
        id: "id-7645-premiada",
        name: transaction.productName || "id-7645 Premiada de Fim de Ano",
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: totalAmountInCents,
      },
    ],
    trackingParameters: extractTrackingParameters(transaction),
    commission: {
      totalPriceInCents: totalAmountInCents,
      gatewayFeeInCents: 0,
      userCommissionInCents: totalAmountInCents,
      currency: "BRL",
    },
    isTest: false,
  }
}

async function sendToUtmify(apiToken: string, payload: UtmifyPayload): Promise<boolean> {
  try {
    const response = await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": apiToken,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    })

    if (response.ok) {
      return true
    }

    const errorText = await response.text()
    console.error(`[UTMIFY] Erro ${response.status} - Order: ${payload.orderId}`, errorText)
    return false
  } catch (error: any) {
    console.error(`[UTMIFY] Erro de rede ao enviar evento para orderId ${payload.orderId}:`, error.message)
    return false
  }
}

export async function sendUtmifyPendingEvent(transaction: TransactionData): Promise<boolean> {
  const apiToken = process.env.UTMIFY_API_TOKEN

  if (!apiToken) {
    console.log("[UTMIFY] UTMIFY_API_TOKEN não configurado - evento pendente não enviado")
    return false
  }

  console.log("[v0] Building UTMify payload for pending event with transaction:", transaction)

  const payload = buildUtmifyPayload(transaction, "waiting_payment")

  console.log("[v0] Final UTMify payload:", JSON.stringify(payload, null, 2))

  return await sendToUtmify(apiToken, payload)
}

export async function sendUtmifyPaidEvent(transaction: TransactionData): Promise<boolean> {
  const apiToken = process.env.UTMIFY_API_TOKEN

  console.log("[UTMIFY] 💰 ===== INICIANDO ENVIO DE EVENTO PAID =====")
  console.log("[UTMIFY] 💰 Order ID:", transaction.orderId)
  console.log("[UTMIFY] 💰 API Token configurado?", apiToken ? "✅ SIM" : "❌ NÃO")

  if (!apiToken) {
    console.log("[UTMIFY] ❌ UTMIFY_API_TOKEN não configurado - evento pago não enviado")
    return false
  }

  console.log("[UTMIFY] 💰 Construindo payload com transaction:", JSON.stringify(transaction, null, 2))

  const payload = buildUtmifyPayload(transaction, "paid")

  console.log("[UTMIFY] 💰 Payload final que será enviado:", JSON.stringify(payload, null, 2))
  console.log("[UTMIFY] 💰 Tracking parameters:", JSON.stringify(payload.trackingParameters, null, 2))

  const result = await sendToUtmify(apiToken, payload)

  if (result) {
    console.log("[UTMIFY] ✅✅✅ VENDA ENVIADA AO DASHBOARD DO UTMIFY!")
    console.log("[UTMIFY] ✅ Order ID:", transaction.orderId)
    console.log("[UTMIFY] ✅ UTM Source:", payload.trackingParameters.utm_source)
    console.log("[UTMIFY] ✅ UTM Campaign:", payload.trackingParameters.utm_campaign)
  } else {
    console.error("[UTMIFY] ❌❌❌ FALHA AO ENVIAR VENDA AO UTMIFY!")
    console.error("[UTMIFY] ❌ Order ID:", transaction.orderId)
  }

  return result
}

export async function sendUtmifyRefusedEvent(transaction: TransactionData): Promise<boolean> {
  const apiToken = process.env.UTMIFY_API_TOKEN

  if (!apiToken) {
    console.log("[UTMIFY] UTMIFY_API_TOKEN não configurado - evento recusado não enviado")
    return false
  }

  const payload = buildUtmifyPayload(transaction, "refused")
  return await sendToUtmify(apiToken, payload)
}

export async function sendUtmifyRefundedEvent(transaction: TransactionData): Promise<boolean> {
  const apiToken = process.env.UTMIFY_API_TOKEN

  if (!apiToken) {
    console.log("[UTMIFY] UTMIFY_API_TOKEN não configurado - evento reembolso não enviado")
    return false
  }

  const payload = buildUtmifyPayload(transaction, "refunded")
  return await sendToUtmify(apiToken, payload)
}
