import { type NextRequest, NextResponse } from "next/server"
import { sendUtmifyPendingEvent } from "@/lib/utmify-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      amount,
      customerName,
      customerEmail,
      customerDocument,
      customerPhone = "11999999999",
      cartItems,
      utmParams,
    } = body

    console.log("[v0] 📝 ===== CRIANDO PIX =====")
    console.log("[v0] Amount:", amount)
    console.log("[v0] Customer:", customerName, customerEmail)
    console.log("[v0] UTM Params recebidos:", JSON.stringify(utmParams, null, 2))

    const secretKey = process.env.COLDFY_SECRET_KEY
    const companyId = process.env.COLDFY_COMPANY_ID

    if (!secretKey || !companyId) {
      console.log("[v0] ⚠️ Coldfy credentials not configured, using mock PIX")

      const mockPixCode = `00020126580014br.gov.bcb.pix0136${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}520400005303986540${amount.toFixed(2)}5802BR5913${customerName.substring(0, 25).replace(/[^a-zA-Z0-9 ]/g, "")}6009SAOPAULO62070503***6304`
      const transactionId = `mock-${Date.now()}`

      try {
        console.log("[v0] 💾 Salvando UTM params para transactionId:", transactionId)
        const saveResponse = await fetch(`${request.nextUrl.origin}/api/payment-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionId,
            status: "pending",
            utmParams,
          }),
        })
        const saveResult = await saveResponse.json()
        console.log("[v0] ✅ UTM params saved to payment-status:", saveResult)
      } catch (error) {
        console.error("[v0] ❌ Failed to save UTM params:", error)
      }

      try {
        const productName = cartItems && cartItems.length > 0 ? cartItems[0].name : "Produto Wepink"

        const utmifyData = {
          orderId: transactionId,
          amount: amount,
          customerName,
          customerEmail,
          customerDocument,
          customerPhone,
          productName,
          createdAt: new Date(),
          // Include all UTM params
          utmSource: utmParams?.utm_source,
          utmMedium: utmParams?.utm_medium,
          utmCampaign: utmParams?.utm_campaign,
          utmContent: utmParams?.utm_content,
          utmTerm: utmParams?.utm_term,
          fbp: utmParams?.fbp,
          fbc: utmParams?.fbc,
          fbclid: utmParams?.fbclid,
          eventSourceUrl: utmParams?.event_source_url,
          userAgent: utmParams?.user_agent,
        }

        console.log("[v0] 📤 Sending to UTMify (pending):", JSON.stringify(utmifyData, null, 2))
        await sendUtmifyPendingEvent(utmifyData)
        console.log("[v0] ✅ UTMify pending event sent successfully")
      } catch (utmifyError) {
        console.error("[v0] ❌ Failed to send UTMify pending event:", utmifyError)
      }

      return NextResponse.json({
        success: true,
        pixCode: mockPixCode,
        pixQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mockPixCode)}`,
        transactionId: transactionId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        isMock: true,
      })
    }

    console.log("[v0] 🔗 Using Coldfy API with configured credentials")

    const requestBody = {
      amount: Math.round(amount * 100),
      paymentMethod: "pix",
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        document: {
          number: customerDocument,
          type: "CPF",
        },
      },
    }

    console.log("[v0] 📤 Request body:", JSON.stringify(requestBody, null, 2))

    const response = await fetch("https://api.coldfypay.com/functions/v1/transactions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()
    console.log("[v0] 📥 Coldfy response:", responseText)

    if (!response.ok) {
      console.error("[v0] ❌ Coldfy API error:", responseText)
      return NextResponse.json(
        { error: "Failed to create PIX transaction", details: responseText },
        { status: response.status },
      )
    }

    const data = JSON.parse(responseText)
    console.log("[v0] ✅ Coldfy PIX created successfully")
    console.log("[v0] Transaction ID:", data.id)
    console.log("[v0] PIX object:", JSON.stringify(data.pix, null, 2))

    const pixCode = data.pix?.qrcode
    console.log("[v0] 🔍 Extracted PIX code:", pixCode)

    const pixQrCodeUrl = pixCode
      ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`
      : undefined

    try {
      console.log("[v0] 💾 Salvando UTM params para transactionId:", data.id)
      console.log("[v0] 💾 UTM Params completos:", JSON.stringify(utmParams, null, 2))

      const saveResponse = await fetch(`${request.nextUrl.origin}/api/payment-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: String(data.id),
          status: "pending",
          utmParams,
        }),
      })
      const saveResult = await saveResponse.json()
      console.log("[v0] ✅ UTM params saved to payment-status:", saveResult)
    } catch (error) {
      console.error("[v0] ❌ Failed to save UTM params:", error)
    }

    try {
      const productName = cartItems && cartItems.length > 0 ? cartItems[0].name : "Produto Wepink"

      const utmifyData = {
        orderId: String(data.id),
        amount: amount,
        customerName,
        customerEmail,
        customerDocument,
        customerPhone,
        productName,
        createdAt: new Date(),
        // Include all UTM params
        utmSource: utmParams?.utm_source,
        utmMedium: utmParams?.utm_medium,
        utmCampaign: utmParams?.utm_campaign,
        utmContent: utmParams?.utm_content,
        utmTerm: utmParams?.utm_term,
        fbp: utmParams?.fbp,
        fbc: utmParams?.fbc,
        fbclid: utmParams?.fbclid,
        eventSourceUrl: utmParams?.event_source_url,
        userAgent: utmParams?.user_agent,
      }

      console.log("[v0] 📤 Sending to UTMify (pending):", JSON.stringify(utmifyData, null, 2))
      await sendUtmifyPendingEvent(utmifyData)
      console.log("[v0] ✅ UTMify pending event sent successfully")
    } catch (utmifyError) {
      console.error("[v0] ❌ Failed to send UTMify pending event:", utmifyError)
    }

    return NextResponse.json({
      success: true,
      pixCode: pixCode,
      pixQrCode: pixQrCodeUrl,
      transactionId: String(data.id),
      expiresAt: data.pix?.expirationDate || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      isMock: false,
    })
  } catch (error) {
    console.error("[v0] ❌ Error creating PIX:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
