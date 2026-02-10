import { type NextRequest, NextResponse } from "next/server"
import { Buffer } from "buffer"

const paymentStatusStore = new Map<string, { status: string; timestamp: number; utmParams?: any }>()

setInterval(() => {
  const now = Date.now()
  const oneHour = 60 * 60 * 1000

  for (const [key, value] of paymentStatusStore.entries()) {
    if (now - value.timestamp > oneHour) {
      paymentStatusStore.delete(key)
    }
  }
}, 60000)

function normalizeId(id: any): string {
  return String(id).trim()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionId, status, utmParams } = body

    console.log("[PAYMENT STATUS] 💾 ===== SALVANDO PAYMENT STATUS =====")
    console.log("[PAYMENT STATUS] 💾 Transaction ID:", transactionId)
    console.log("[PAYMENT STATUS] 💾 Status:", status)
    console.log("[PAYMENT STATUS] 💾 UTM Params:", JSON.stringify(utmParams, null, 2))

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID é obrigatório" }, { status: 400 })
    }

    const normalizedId = normalizeId(transactionId)
    const existingData = paymentStatusStore.get(normalizedId) || {}

    const updatedData = {
      status: status || existingData.status || "pending",
      timestamp: Date.now(),
      utmParams: utmParams || existingData.utmParams || {},
    }

    paymentStatusStore.set(normalizedId, updatedData)

    console.log("[PAYMENT STATUS] ✅ Dados salvos para ID:", normalizedId)
    console.log("[PAYMENT STATUS] ✅ Dados:", JSON.stringify(updatedData, null, 2))

    return NextResponse.json({
      success: true,
      message: "Status salvo com sucesso",
      data: updatedData,
    })
  } catch (error: any) {
    console.error("[PAYMENT STATUS] ❌ Erro ao salvar status:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const transactionId = searchParams.get("transactionId") || searchParams.get("orderId") || ""

    console.log("[PAYMENT STATUS] 🔍 ===== CONSULTANDO PAYMENT STATUS =====")
    console.log("[PAYMENT STATUS] 🔍 Transaction ID recebido:", transactionId)

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID é obrigatório" }, { status: 400 })
    }

    const normalizedId = normalizeId(transactionId)
    console.log("[PAYMENT STATUS] 🔍 Transaction ID normalizado:", normalizedId)

    const secretKey = process.env.COLDFY_SECRET_KEY
    if (secretKey && !transactionId.startsWith("mock-")) {
      try {
        console.log("[PAYMENT STATUS] 🔍 Verificando status diretamente na Coldfy...")
        const coldfyResponse = await fetch(`https://api.coldfypay.com/functions/v1/transactions/${normalizedId}`, {
          headers: {
            Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
          },
        })

        if (coldfyResponse.ok) {
          const coldfyData = await coldfyResponse.json()
          console.log("[PAYMENT STATUS] 📥 Status da Coldfy:", coldfyData.status)

          const isPaid = coldfyData.status === "paid" || coldfyData.status === "approved"

          if (isPaid) {
            console.log("[PAYMENT STATUS] ✅ PAGAMENTO APROVADO pela Coldfy API!")

            // Get stored UTMs if any
            const statusData = paymentStatusStore.get(normalizedId)

            return NextResponse.json({
              success: true,
              paid: true,
              status: "paid",
              timestamp: Date.now(),
              utmParams: statusData?.utmParams || {},
            })
          }
        }
      } catch (error: any) {
        console.error("[PAYMENT STATUS] ⚠️ Erro ao consultar Coldfy:", error.message)
      }
    }

    const statusData = paymentStatusStore.get(normalizedId)

    console.log("[PAYMENT STATUS] 🔍 Dados encontrados no Map:", statusData ? JSON.stringify(statusData, null, 2) : "Nenhum dado")

    if (!statusData) {
      console.log("[PAYMENT STATUS] ⚠️ Nenhum dado encontrado para este ID")
      return NextResponse.json({
        success: false,
        paid: false,
        status: "pending",
        utmParams: {},
      })
    }

    const isPaid = statusData.status === "paid" || statusData.status === "approved" || statusData.status === "completed"

    console.log("[PAYMENT STATUS] 📊 Status:", statusData.status)
    console.log("[PAYMENT STATUS] 📊 É pago?", isPaid)

    return NextResponse.json({
      success: true,
      paid: isPaid,
      status: statusData.status,
      timestamp: statusData.timestamp,
      utmParams: statusData.utmParams || {},
    })
  } catch (error: any) {
    console.error("[PAYMENT STATUS] ❌ Erro ao consultar status:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

