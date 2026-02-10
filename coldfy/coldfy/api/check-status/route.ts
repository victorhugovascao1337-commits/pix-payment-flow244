import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { transactionId } = body

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID é obrigatório" }, { status: 400 })
    }

    const secretKey = process.env.COLDFY_SECRET_KEY

    if (!secretKey) {
      console.error("[v0] Credenciais Coldfy não configuradas")
      return NextResponse.json({ error: "Credenciais não configuradas" }, { status: 500 })
    }

    console.log("[v0] Consultando Coldfy API para transactionId:", transactionId)

    const endpoint = `https://api.coldfypay.com/functions/v1/transactions/${transactionId}`

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    const responseText = await response.text()
    console.log("[v0] Resposta raw da Coldfy API:", responseText)

    let result
    try {
      result = JSON.parse(responseText)
      console.log("[v0] Resposta da Coldfy API (parsed):", JSON.stringify(result, null, 2))
    } catch (e) {
      console.error("[v0] Erro ao parsear resposta da Coldfy:", e)
      return NextResponse.json(
        {
          error: "Erro ao consultar API Coldfy - resposta inválida",
          details: responseText,
        },
        { status: 500 },
      )
    }

    const status = result.status === "paid" ? "paid" : "pending"

    return NextResponse.json({
      success: true,
      status: status,
      data: result,
    })
  } catch (error: any) {
    console.error("[v0] Erro ao consultar status na Coldfy:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
