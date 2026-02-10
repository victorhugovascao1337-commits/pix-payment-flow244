import { type NextRequest, NextResponse } from "next/server"
import { sendUtmifyPendingEvent, sendUtmifyPaidEvent, sendUtmifyRefusedEvent, type TransactionData } from "@/lib/utmify/utmify-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status, amount, customer, trackingParameters, productName } = body

    console.log("[UTMIFY API] 💰 ===== API UTMIFY RECEBEU =====")
    console.log("[UTMIFY API] Order ID:", orderId)
    console.log("[UTMIFY API] Status:", status)
    console.log("[UTMIFY API] Amount:", amount)
    console.log("[UTMIFY API] Customer:", JSON.stringify(customer, null, 2))
    console.log("[UTMIFY API] Tracking Params:", JSON.stringify(trackingParameters, null, 2))

    const orderIdStr = String(orderId || "")

    if (!orderIdStr || orderIdStr.trim() === "") {
      console.error("[UTMIFY API] ❌ orderId vazio ou inválido")
      return NextResponse.json({ error: "orderId é obrigatório" }, { status: 400 })
    }

    // Constrói TransactionData
    const transaction: TransactionData = {
      orderId: orderIdStr,
      amount: amount || 0,
      customerName: customer?.name || "Cliente",
      customerEmail: customer?.email || "",
      customerDocument: customer?.document || "",
      customerPhone: customer?.phone || "",
      productName: productName || "Álbum Panini Copa 2026",
      paymentMethod: "pix",
      utmSource: trackingParameters?.utm_source || trackingParameters?.src || undefined,
      utmMedium: trackingParameters?.utm_medium || undefined,
      utmCampaign: trackingParameters?.utm_campaign || undefined,
      utmContent: trackingParameters?.utm_content || undefined,
      utmTerm: trackingParameters?.utm_term || undefined,
      createdAt: new Date(),
      approvedAt: status === "paid" ? new Date() : undefined,
    }

    // Envia evento baseado no status
    let result = false
    if (status === "waiting_payment") {
      result = await sendUtmifyPendingEvent(transaction)
    } else if (status === "paid") {
      result = await sendUtmifyPaidEvent(transaction)
    } else if (status === "refused") {
      result = await sendUtmifyRefusedEvent(transaction)
    } else {
      console.warn("[UTMIFY API] ⚠️ Status não reconhecido:", status)
      return NextResponse.json({ error: "Status inválido" }, { status: 400 })
    }

    if (result) {
      console.log("[UTMIFY API] ✅✅✅ EVENTO ENVIADO COM SUCESSO AO UTMIFY!")
      return NextResponse.json({
        success: true,
        message: "Evento enviado ao UTMify com sucesso",
        orderId: orderIdStr,
        status,
      })
    } else {
      console.error("[UTMIFY API] ❌ Falha ao enviar evento")
      return NextResponse.json(
        { error: "Erro ao enviar evento para UTMify" },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("[UTMIFY API] ❌ Error ao processar requisição:", error)
    return NextResponse.json({ error: "Erro interno do servidor", details: error.message }, { status: 500 })
  }
}

