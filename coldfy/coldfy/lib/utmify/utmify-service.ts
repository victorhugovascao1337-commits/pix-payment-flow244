// lib/utmify/utmify-service.ts

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
  fbp?: string
  fbc?: string
  fbclid?: string
  eventSourceUrl?: string
  userAgent?: string
}

/**
 * Formata data para o padrão do Utmify: YYYY-MM-DD HH:MM:SS
 */
function formatDateForUtmify(date: Date): string {
  return date.toISOString().replace("T", " ").substring(0, 19)
}

/**
 * Extrai parâmetros de tracking da transação
 */
function extractTrackingParameters(transaction: TransactionData): UtmifyPayload["trackingParameters"] {
  console.log("[UTMIFY] 📊 Extraindo parâmetros de tracking:", {
    utmSource: transaction.utmSource,
    utmMedium: transaction.utmMedium,
    utmCampaign: transaction.utmCampaign,
    utmContent: transaction.utmContent,
    utmTerm: transaction.utmTerm,
  })

  // Se não tem utm_source, usa "organic" como fallback
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

  console.log("[UTMIFY] ✅ Parâmetros extraídos:", params)
  return params
}

/**
 * Constrói o payload completo para enviar ao Utmify
 */
function buildUtmifyPayload(
  transaction: TransactionData,
  status: "waiting_payment" | "paid" | "refused" | "refunded" | "chargedback",
): UtmifyPayload {
  const totalAmountInCents = Math.round(transaction.amount * 100)
  const createdAt = transaction.createdAt || new Date()

  console.log("[UTMIFY] 🔨 Construindo payload - Status:", status, "Valor:", totalAmountInCents / 100)

  return {
    orderId: transaction.orderId,
    platform: "Wepink E-commerce",
    paymentMethod: (transaction.paymentMethod as any) || "pix",
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
      name: transaction.customerName || "Cliente",
      email: transaction.customerEmail || "nao-informado@wepink.com.br",
      phone: transaction.customerPhone || null,
      document: transaction.customerDocument || null,
      country: "BR",
    },
    products: [
      {
        id: "wepink-produto",
        name: transaction.productName || "Produtos Wepink",
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

/**
 * Envia o payload para a API do Utmify
 */
async function sendToUtmify(apiToken: string, payload: UtmifyPayload): Promise<boolean> {
  console.log("[UTMIFY] 📤 ===== ENVIANDO PARA UTMIFY API =====")
  console.log("[UTMIFY] 📤 Order ID:", payload.orderId)
  console.log("[UTMIFY] 📤 Status:", payload.status)
  console.log("[UTMIFY] 📤 Valor:", payload.commission.totalPriceInCents / 100)
  console.log("[UTMIFY] 📤 UTM Source:", payload.trackingParameters.utm_source)
  console.log("[UTMIFY] 📤 UTM Campaign:", payload.trackingParameters.utm_campaign)
  console.log("[UTMIFY] 📤 Payload completo:", JSON.stringify(payload, null, 2))

  try {
    const response = await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": apiToken,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30 segundos timeout
    })

    const responseText = await response.text()
    
    console.log("[UTMIFY] 📥 Status HTTP:", response.status)
    console.log("[UTMIFY] 📥 Resposta:", responseText)

    if (response.ok) {
      console.log("[UTMIFY] ✅✅✅ EVENTO ENVIADO COM SUCESSO! ✅✅✅")
      console.log("[UTMIFY] ✅ Order:", payload.orderId)
      console.log("[UTMIFY] ✅ Status:", payload.status)
      return true
    } else {
      console.error("[UTMIFY] ❌ ERRO AO ENVIAR - Status:", response.status)
      console.error("[UTMIFY] ❌ Resposta:", responseText)
      return false
    }
  } catch (error: any) {
    console.error("[UTMIFY] ❌ ERRO DE REDE ao enviar para Utmify:", error.message)
    console.error("[UTMIFY] ❌ Stack:", error.stack)
    return false
  }
}

/**
 * Envia evento de pagamento pendente (waiting_payment)
 */
export async function sendUtmifyPendingEvent(transaction: TransactionData): Promise<boolean> {
  console.log("[UTMIFY] ⏳ Iniciando envio de evento PENDING...")
  
  const apiToken = process.env.UTMIFY_API_TOKEN

  if (!apiToken) {
    console.error("[UTMIFY] ❌ UTMIFY_API_TOKEN não configurado nas variáveis de ambiente!")
    console.error("[UTMIFY] ❌ Configure em: .env.local ou Vercel Dashboard")
    return false
  }

  const payload = buildUtmifyPayload(transaction, "waiting_payment")
  return await sendToUtmify(apiToken, payload)
}

/**
 * Envia evento de pagamento aprovado (paid)
 * ESTE É O EVENTO PRINCIPAL QUE APARECE NO DASHBOARD!
 */
export async function sendUtmifyPaidEvent(transaction: TransactionData): Promise<boolean> {
  console.log("[UTMIFY] 💰 ===== INICIANDO ENVIO DE EVENTO PAID =====")
  console.log("[UTMIFY] 💰 Transaction ID:", transaction.orderId)
  console.log("[UTMIFY] 💰 Valor:", transaction.amount)
  console.log("[UTMIFY] 💰 Cliente:", transaction.customerName)
  
  const apiToken = process.env.UTMIFY_API_TOKEN

  if (!apiToken) {
    console.error("[UTMIFY] ❌❌❌ UTMIFY_API_TOKEN NÃO CONFIGURADO! ❌❌❌")
    console.error("[UTMIFY] ❌ O evento NÃO será enviado ao dashboard!")
    console.error("[UTMIFY] ❌ Configure a variável UTMIFY_API_TOKEN no Vercel ou .env.local")
    return false
  }

  console.log("[UTMIFY] ✅ API Token encontrado (primeiros 10 chars):", apiToken.substring(0, 10) + "...")

  const payload = buildUtmifyPayload(transaction, "paid")
  const result = await sendToUtmify(apiToken, payload)

  if (result) {
    console.log("[UTMIFY] 🎉🎉🎉 VENDA ENVIADA AO DASHBOARD DO UTMIFY! 🎉🎉🎉")
    console.log("[UTMIFY] 🎉 Acesse: https://app.utmify.com.br/dashboard")
  } else {
    console.error("[UTMIFY] ❌ FALHA ao enviar venda ao dashboard")
  }

  return result
}

/**
 * Envia evento de pagamento recusado (refused)
 */
export async function sendUtmifyRefusedEvent(transaction: TransactionData): Promise<boolean> {
  console.log("[UTMIFY] 🚫 Iniciando envio de evento REFUSED...")
  
  const apiToken = process.env.UTMIFY_API_TOKEN

  if (!apiToken) {
    console.error("[UTMIFY] ❌ UTMIFY_API_TOKEN não configurado")
    return false
  }

  const payload = buildUtmifyPayload(transaction, "refused")
  return await sendToUtmify(apiToken, payload)
}

/**
 * Envia evento de reembolso (refunded)
 */
export async function sendUtmifyRefundedEvent(transaction: TransactionData): Promise<boolean> {
  console.log("[UTMIFY] 💸 Iniciando envio de evento REFUNDED...")
  
  const apiToken = process.env.UTMIFY_API_TOKEN

  if (!apiToken) {
    console.error("[UTMIFY] ❌ UTMIFY_API_TOKEN não configurado")
    return false
  }

  const payload = buildUtmifyPayload(transaction, "refunded")
  return await sendToUtmify(apiToken, payload)
}
