import { NextResponse } from "next/server"
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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { transactionId, status, utmParams } = body

    console.log("[v0] 💾 ===== SALVANDO PAYMENT STATUS =====")
    console.log("[v0] 💾 Transaction ID:", transactionId)
    console.log("[v0] 💾 Status:", status)
    console.log("[v0] 💾 UTM Params:", JSON.stringify(utmParams, null, 2))

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

    console.log("[v0] ✅ Dados salvos para ID:", normalizedId)
    console.log("[v0] ✅ Dados:", JSON.stringify(updatedData, null, 2))
    console.log("[v0] 📋 Total armazenado:", paymentStatusStore.size)
    console.log("[v0] 📋 IDs disponíveis:", Array.from(paymentStatusStore.keys()))

    return NextResponse.json({
      success: true,
      message: "Status salvo com sucesso",
      data: updatedData,
    })
  } catch (error: any) {
    console.error("[v0] ❌ Erro ao salvar status:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get("transactionId")

    console.log("[v0] 🔍 ===== CONSULTANDO PAYMENT STATUS =====")
    console.log("[v0] 🔍 Transaction ID recebido:", transactionId)

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID é obrigatório" }, { status: 400 })
    }

    const normalizedId = normalizeId(transactionId)
    console.log("[v0] 🔍 Transaction ID normalizado:", normalizedId)

    const secretKey = process.env.COLDFY_SECRET_KEY
    if (secretKey && !transactionId.startsWith("mock-")) {
      try {
        console.log("[v0] 🔍 Verificando status diretamente na Coldfy...")
        const coldfyResponse = await fetch(`https://api.coldfypay.com/functions/v1/transactions/${normalizedId}`, {
          headers: {
            Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
          },
        })

        if (coldfyResponse.ok) {
          const coldfyData = await coldfyResponse.json()
          console.log("[v0] 📥 Status da Coldfy:", coldfyData.status)

          const isPaid = coldfyData.status === "paid" || coldfyData.status === "approved"

          if (isPaid) {
            console.log("[v0] ✅ PAGAMENTO APROVADO pela Coldfy API!")

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
        console.error("[v0] ⚠️ Erro ao consultar Coldfy:", error.message)
      }
    }

    const statusData = paymentStatusStore.get(normalizedId)

    console.log("[v0] 🔍 Dados encontrados no Map:", statusData ? JSON.stringify(statusData, null, 2) : "Nenhum dado")
    console.log("[v0] 🔍 IDs disponíveis no Map:", Array.from(paymentStatusStore.keys()))

    if (!statusData) {
      console.log("[v0] ⚠️ Nenhum dado encontrado para este ID")
      return NextResponse.json({
        success: false,
        paid: false,
        status: "pending",
        utmParams: {},
      })
    }

    const isPaid = statusData.status === "paid" || statusData.status === "approved" || statusData.status === "completed"

    console.log("[v0] 📊 Status:", statusData.status)
    console.log("[v0] 📊 É pago?", isPaid)

    return NextResponse.json({
      success: true,
      paid: isPaid,
      status: statusData.status,
      timestamp: statusData.timestamp,
      utmParams: statusData.utmParams || {},
    })
  } catch (error: any) {
    console.error("[v0] ❌ Erro ao consultar status:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
