import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const timestamp = new Date().toISOString()
  console.log("\n\n")
  console.log("=".repeat(80))
  console.log(`[v0] 🔔🔔🔔 WEBHOOK COLDFY CHAMADO! ${timestamp}`)
  console.log("=".repeat(80))

  try {
    const headers = Object.fromEntries(request.headers.entries())
    console.log("[v0] 📋 Headers recebidos:")
    console.log(JSON.stringify(headers, null, 2))

    const bodyText = await request.text()
    console.log("[v0] 📦 Body RAW (texto):")
    console.log(bodyText)

    let body
    try {
      body = JSON.parse(bodyText)
      console.log("[v0] ✅ Body PARSED (JSON):")
      console.log(JSON.stringify(body, null, 2))
    } catch (e) {
      console.error("[v0] ❌ ERRO: Body não é JSON válido!")
      console.error(e)
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const data = body.data || body
    const transactionId = String(
      data.id || body.trans_id || body.id || body.transaction_id || body.transactionId || "",
    ).trim()

    console.log("[v0] 🆔 Transaction ID extraído:", transactionId)

    if (!transactionId) {
      console.error("[v0] ❌ ERRO: Nenhum transaction ID encontrado no webhook!")
      return NextResponse.json({ error: "No transaction ID" }, { status: 400 })
    }

    console.log("[v0] 🔍 ===== DEBUGANDO STATUS =====")
    console.log("[v0]   - body.data =", body.data ? "EXISTE" : "NÃO EXISTE")
    console.log("[v0]   - body.data.status =", body.data?.status)
    console.log("[v0]   - body.status =", body.status)
    console.log("[v0]   - body.pay_status =", body.pay_status)
    console.log("[v0]   - body.trans_status =", body.trans_status)
    console.log("[v0]   - body.payment_status =", body.payment_status)
    console.log("[v0]   - data.status =", data.status)
    console.log("[v0] ===============================")

    const rawStatus = (
      data.status ||
      body.data?.status ||
      body.status ||
      body.pay_status ||
      body.trans_status ||
      body.payment_status ||
      body.transaction_status ||
      ""
    )
      .toString()
      .toUpperCase()
      .trim()

    const statusAprovados = [
      "PAID",
      "APPROVED",
      "APROVADO",
      "SUCCESS",
      "SUCCESSFUL",
      "COMPLETED",
      "COMPLETE",
      "PAGO",
      "CONFIRMADO",
      "CONFIRMED",
      "PAYMENT_CONFIRMED",
      "TRANSACTION_APPROVED",
      "FINISHED",
      "DONE",
    ]
    const isPaid = statusAprovados.includes(rawStatus)

    console.log("[v0] 📊 Status RAW encontrado:", rawStatus)
    console.log("[v0] 📊 Status está na lista?", isPaid ? "✅ SIM" : "❌ NÃO")

    if (!isPaid) {
      console.log("\n\n")
      console.log("=".repeat(80))
      console.log("[v0] ⚠️⚠️⚠️ WEBHOOK REJEITADO - STATUS NÃO RECONHECIDO!")
      console.log("=".repeat(80))
      console.log(`[v0] ❌ Status recebido: "${rawStatus}"`)
      console.log("[v0] 📋 Todos os campos de status no body:")
      console.log(`   - data.status: "${data.status}"`)
      console.log(`   - body.data?.status: "${body.data?.status}"`)
      console.log(`   - body.status: "${body.status}"`)
      console.log(`   - body.pay_status: "${body.pay_status}"`)
      console.log("[v0] 💡 AÇÃO NECESSÁRIA: Adicione o status acima à lista!")
      console.log("=".repeat(80))
      console.log("\n\n")

      return NextResponse.json(
        {
          success: false,
          message: `STATUS NÃO RECONHECIDO: "${rawStatus}"`,
          statusRecebido: rawStatus,
          statusAprovados: statusAprovados,
          todosOsCamposDeStatus: {
            "data.status": data.status,
            "body.data?.status": body.data?.status,
            "body.status": body.status,
            "body.pay_status": body.pay_status,
          },
        },
        { status: 200 },
      )
    }

    console.log("[v0] ✅✅✅ PAGAMENTO APROVADO! Processando...")

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

    console.log("[v0] 🌐 Base URL:", baseUrl)

    // ✅ CORREÇÃO: Garantir que sempre tenhamos UTMs válidos
    let utmParams = {
      utm_source: "organic",
      utm_medium: "organic",
      utm_campaign: "organic",
      utm_content: null,
      utm_term: null,
    }

    try {
      console.log("[v0] 🔍 Buscando UTMs salvos para transactionId:", transactionId)
      const statusUrl = `${baseUrl}/api/payment-status?transactionId=${transactionId}`
      console.log("[v0] 🔍 URL:", statusUrl)

      const statusResponse = await fetch(statusUrl)
      console.log("[v0] 📥 Response status:", statusResponse.status)

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        console.log("[v0] 📥 Dados recebidos:", JSON.stringify(statusData, null, 2))

        // ✅ Verifica se UTMs existem E não estão vazios
        if (
          statusData.utmParams &&
          typeof statusData.utmParams === "object" &&
          Object.keys(statusData.utmParams).length > 0 &&
          statusData.utmParams.utm_source
        ) {
          utmParams = {
            utm_source: statusData.utmParams.utm_source || "organic",
            utm_medium: statusData.utmParams.utm_medium || "organic",
            utm_campaign: statusData.utmParams.utm_campaign || "organic",
            utm_content: statusData.utmParams.utm_content || null,
            utm_term: statusData.utmParams.utm_term || null,
          }
          console.log("[v0] ✅✅✅ UTMs ENCONTRADOS E VALIDADOS!")
          console.log(JSON.stringify(utmParams, null, 2))
        } else {
          console.log("[v0] ⚠️ UTMs vazios ou inválidos, usando fallback 'organic'")
        }
      } else {
        console.log("[v0] ⚠️ Erro ao buscar status, usando fallback 'organic'")
      }
    } catch (error: any) {
      console.error("[v0] ❌ Erro ao buscar UTMs, usando fallback 'organic':", error.message)
    }

    console.log("[v0] 📋 UTMs finais que serão enviados:")
    console.log(JSON.stringify(utmParams, null, 2))

    const customer = {
      name: data.customer?.name || body.customer_name || body.customer?.name || "Cliente",
      email: data.customer?.email || body.customer_email || body.customer?.email || "",
      phone: data.customer?.phone || body.customer_phone || body.customer?.phone || "",
      document: data.customer?.document || body.customer_document || body.customer?.document || "",
    }

    const amount = data.amount
      ? data.amount / 100
      : body.amount
        ? body.amount / 100
        : body.trans_amt
          ? body.trans_amt / 100
          : 0

    console.log("[v0] 💰 Valor:", amount)
    console.log("[v0] 👤 Cliente:", JSON.stringify(customer, null, 2))

    try {
      console.log("[v0] 📤 ===== ENVIANDO PARA UTMIFY =====")

      const utmifyPayload = {
        orderId: transactionId,
        status: "paid",
        amount,
        customer,
        trackingParameters: utmParams, // ✅ Sempre com todos os 5 campos
      }

      console.log("[v0] 📤 Payload COMPLETO para UTMify:")
      console.log(JSON.stringify(utmifyPayload, null, 2))

      const utmifyResponse = await fetch(`${baseUrl}/api/utmify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(utmifyPayload),
      })

      const utmifyResult = await utmifyResponse.json()

      if (!utmifyResponse.ok) {
        console.error("[v0] ❌ UTMify retornou erro:")
        console.error(JSON.stringify(utmifyResult, null, 2))
        throw new Error(`UTMify API retornou erro: ${JSON.stringify(utmifyResult)}`)
      }

      console.log("[v0] ✅✅✅ VENDA PAGA ENVIADA AO UTMIFY COM SUCESSO!")
      console.log("[v0] ✅ Resultado:", JSON.stringify(utmifyResult, null, 2))
    } catch (error: any) {
      console.error("[v0] ❌❌❌ ERRO CRÍTICO ao enviar para UTMify:", error.message)
      console.error(error.stack)
      throw error
    }

    try {
      console.log("[v0] 💾 Atualizando status para 'paid'...")
      await fetch(`${baseUrl}/api/payment-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          status: "paid",
          utmParams,
        }),
      })
      console.log("[v0] ✅ Status atualizado")
    } catch (error: any) {
      console.error("[v0] ⚠️ Erro ao atualizar status (não crítico):", error.message)
    }

    console.log("=".repeat(80))
    console.log("[v0] ✅✅✅ WEBHOOK PROCESSADO COM SUCESSO!")
    console.log("=".repeat(80))
    console.log("\n\n")

    return NextResponse.json({
      success: true,
      message: "Pagamento aprovado e enviado ao UTMify",
      transactionId,
    })
  } catch (error: any) {
    console.error("=".repeat(80))
    console.error("[v0] ❌❌❌ ERRO CRÍTICO NO WEBHOOK!")
    console.error("[v0] ❌ Message:", error.message)
    console.error("[v0] ❌ Stack:", error.stack)
    console.error("=".repeat(80))
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Webhook Coldfy ativo",
    timestamp: new Date().toISOString(),
  })
}
