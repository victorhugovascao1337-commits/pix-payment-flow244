import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status, amount, customer, trackingParameters } = body

    console.log("[v0] 💰 ===== API UTMIFY RECEBEU =====")
    console.log("[v0] Order ID:", orderId)
    console.log("[v0] Status:", status)
    console.log("[v0] Amount:", amount)
    console.log("[v0] Customer:", JSON.stringify(customer, null, 2))
    console.log("[v0] Tracking Params:", JSON.stringify(trackingParameters, null, 2))

    const orderIdStr = String(orderId || "")

    if (!orderIdStr || orderIdStr.trim() === "") {
      console.error("[v0] ❌ orderId vazio ou inválido")
      return NextResponse.json({ error: "orderId é obrigatório" }, { status: 400 })
    }

    const token = process.env.UTMIFY_API_TOKEN

    if (!token) {
      console.warn("[v0] ⚠️ UTMIFY_API_TOKEN não configurado")
      return NextResponse.json({ error: "Token não configurado" }, { status: 500 })
    }

    const amountInCents = Math.round((amount || 0) * 100)

    function formatUTCDate(date = new Date()) {
      return date.toISOString().slice(0, 19).replace("T", " ")
    }

    const normalizedTrackingParams = {
      src: trackingParameters?.src || null,
      sck: trackingParameters?.sck || null,
      utm_source: trackingParameters?.utm_source || null,
      utm_campaign: trackingParameters?.utm_campaign || null,
      utm_medium: trackingParameters?.utm_medium || null,
      utm_content: trackingParameters?.utm_content || null,
      utm_term: trackingParameters?.utm_term || null,
    }

    const payload = {
      orderId: orderIdStr,
      platform: "WePink Brasil",
      paymentMethod: "pix",
      status,
      createdAt: formatUTCDate(),
      approvedDate: status === "paid" ? formatUTCDate() : null,
      refundedAt: null,

      customer: {
        name: customer?.name || "Cliente",
        email: customer?.email || "",
        phone: customer?.phone || "",
        document: customer?.document || "",
        country: "BR",
      },

      products: [
        {
          id: "wepink-001",
          name: "Produtos WePink",
          planId: null,
          planName: null,
          quantity: 1,
          priceInCents: amountInCents,
        },
      ],

      trackingParameters: normalizedTrackingParams,

      commission: {
        totalPriceInCents: amountInCents,
        gatewayFeeInCents: 0,
        userCommissionInCents: amountInCents,
        currency: "BRL",
      },
    }

    console.log("[v0] 📤 Enviando payload para UTMify:", JSON.stringify(payload, null, 2))

    const response = await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": token,
      },
      body: JSON.stringify(payload),
    })

    const text = await response.text()
    console.log("[v0] 📥 UTMify Status:", response.status)
    console.log("[v0] 📥 UTMify Response:", text)

    if (!response.ok) {
      console.error("[v0] ❌ Erro ao enviar para UTMify:", text)
      return NextResponse.json(
        {
          error: "Erro ao enviar para UTMify",
          status: response.status,
          details: text,
        },
        { status: response.status },
      )
    }

    const data = JSON.parse(text)
    console.log("[v0] ✅✅✅ EVENTO ENVIADO COM SUCESSO AO UTMIFY!")
    console.log("[v0] Status:", status, "| Order ID:", orderIdStr)

    return NextResponse.json({
      success: true,
      message: "Evento enviado ao UTMify com sucesso",
      data,
      orderId: orderIdStr,
      status,
    })
  } catch (error: any) {
    console.error("[v0] ❌ Error ao processar requisição:", error)
    return NextResponse.json({ error: "Erro interno do servidor", details: error.message }, { status: 500 })
  }
}
