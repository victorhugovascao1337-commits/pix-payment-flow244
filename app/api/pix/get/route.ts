import { type NextRequest, NextResponse } from "next/server"
import { Buffer } from "buffer"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const transactionId = searchParams.get("transactionId") || searchParams.get("orderId") || ""

    if (!transactionId) {
      return NextResponse.json({ error: "transactionId é obrigatório" }, { status: 400 })
    }

    const secretKey = process.env.COLDFY_SECRET_KEY

    if (!secretKey) {
      return NextResponse.json({ error: "Coldfy credentials not configured" }, { status: 500 })
    }

    console.log("[PIX GET] 🔍 Buscando transação na Coldfy:", transactionId)

    const response = await fetch(`https://api.coldfypay.com/functions/v1/transactions/${transactionId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[PIX GET] ❌ Erro ao buscar transação:", errorText)
      return NextResponse.json(
        { error: "Failed to fetch transaction", details: errorText },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[PIX GET] 📥 Resposta completa da Coldfy:", JSON.stringify(data, null, 2))
    
    // Try multiple possible paths for PIX code
    const pixCode = data.pix?.qrcode || data.pix?.qrCode || data.pix?.code || data.qrcode || data.qrCode || data.code
    console.log("[PIX GET] 🔍 Código PIX encontrado:", pixCode ? pixCode.substring(0, 100) + "..." : "NÃO ENCONTRADO")

    if (!pixCode) {
      console.error("[PIX GET] ❌❌❌ CÓDIGO PIX NÃO ENCONTRADO NA RESPOSTA! ❌❌❌")
      console.error("[PIX GET] ❌ Estrutura completa:", JSON.stringify(data, null, 2))
      return NextResponse.json(
        { 
          error: "PIX code not found in transaction",
          details: "A resposta da Coldfy não contém o código PIX",
          response: data,
        },
        { status: 404 },
      )
    }

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`

    return NextResponse.json({
      success: true,
      pixCode,
      qrCodeUrl,
      transactionId: data.id,
      status: data.status,
    })
  } catch (error: any) {
    console.error("[PIX GET] ❌ Error:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}

