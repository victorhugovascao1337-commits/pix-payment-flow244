import { type NextRequest, NextResponse } from "next/server"
import { Buffer } from "buffer"
import { sendUtmifyPendingEvent, type TransactionData } from "@/lib/utmify/utmify-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      amount,
      customerName,
      customerEmail,
      customerDocument,
      customerPhone = "11999999999",
      kitId,
      customerAddress,
      items,
      trackingParameters,
    } = body

    console.log("[PIX CREATE] 📝 ===== CRIANDO PIX =====")
    console.log("[PIX CREATE] Amount:", amount)
    console.log("[PIX CREATE] Customer:", customerName, customerEmail)
    console.log("[PIX CREATE] Customer Address recebido:", JSON.stringify(customerAddress, null, 2))
    console.log("[PIX CREATE] Items recebidos:", JSON.stringify(items, null, 2))
    console.log("[PIX CREATE] UTM Params recebidos:", JSON.stringify(trackingParameters, null, 2))

    const secretKey = process.env.COLDFY_SECRET_KEY
    const companyId = process.env.COLDFY_COMPANY_ID

    if (!secretKey || !companyId) {
      console.log("[PIX CREATE] ⚠️ Coldfy credentials not configured, using mock PIX")

      const mockPixCode = `00020126580014br.gov.bcb.pix0136${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}520400005303986540${amount.toFixed(2)}5802BR5913${customerName.substring(0, 25).replace(/[^a-zA-Z0-9 ]/g, "")}6009SAOPAULO62070503***6304`
      const transactionId = `mock-${Date.now()}`

      try {
        console.log("[PIX CREATE] 💾 Salvando UTM params para transactionId:", transactionId)
        const saveResponse = await fetch(`${request.nextUrl.origin}/api/payment-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionId,
            status: "pending",
            utmParams: trackingParameters,
          }),
        })
        const saveResult = await saveResponse.json()
        console.log("[PIX CREATE] ✅ UTM params saved to payment-status:", saveResult)
      } catch (error) {
        console.error("[PIX CREATE] ❌ Failed to save UTM params:", error)
      }

      try {
        const productName = `Kit ${kitId || "Panini Copa 2026"}`

        const utmifyData: TransactionData = {
          orderId: transactionId,
          amount: amount,
          customerName,
          customerEmail,
          customerDocument,
          customerPhone,
          productName,
          createdAt: new Date(),
          utmSource: trackingParameters?.utm_source || trackingParameters?.src,
          utmMedium: trackingParameters?.utm_medium,
          utmCampaign: trackingParameters?.utm_campaign,
          utmContent: trackingParameters?.utm_content,
          utmTerm: trackingParameters?.utm_term,
        }

        console.log("[PIX CREATE] 📤 Sending to UTMify (pending):", JSON.stringify(utmifyData, null, 2))
        await sendUtmifyPendingEvent(utmifyData)
        console.log("[PIX CREATE] ✅ UTMify pending event sent successfully")
      } catch (utmifyError) {
        console.error("[PIX CREATE] ❌ Failed to send UTMify pending event:", utmifyError)
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

    console.log("[PIX CREATE] 🔗 Using Coldfy API with configured credentials")

    // Clean CPF - remove all non-digits
    const cleanDocument = customerDocument.replace(/\D/g, "")
    
    // Validate CPF length
    if (cleanDocument.length !== 11) {
      console.error("[PIX CREATE] ❌ CPF inválido - deve ter 11 dígitos:", cleanDocument)
      return NextResponse.json(
        { error: "Invalid CPF", message: "CPF must have 11 digits" },
        { status: 400 },
      )
    }
    
    // Build customer object with address if provided
    const customer: any = {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      document: {
        number: cleanDocument,
        type: "CPF",
      },
    }

    // Add address if provided - MUST use the address from the form
    if (customerAddress) {
      console.log("[PIX CREATE] 📍 Endereço recebido do checkout:", JSON.stringify(customerAddress, null, 2))
      
      // Validate required address fields
      if (!customerAddress.street || !customerAddress.zipCode) {
        console.warn("[PIX CREATE] ⚠️ Endereço incompleto - faltando rua ou CEP")
      }
      
      // Always use the address provided by the user, even if incomplete
      // Format exactly as Coldfy expects based on working transaction
      customer.address = {
        street: (customerAddress.street || "").trim(),
        streetNumber: (customerAddress.streetNumber || "S/N").trim(),
        complement: (customerAddress.complement || "").trim(),
        zipCode: customerAddress.zipCode ? customerAddress.zipCode.replace(/\D/g, "") : "",
        neighborhood: (customerAddress.neighborhood || "").trim(),
        city: (customerAddress.city || "").trim(),
        state: (customerAddress.state || "").trim().toUpperCase(),
        country: customerAddress.country || "BR",
      }
      
      // Remove empty fields to avoid sending empty strings
      if (!customer.address.complement) {
        delete customer.address.complement
      }
      
      console.log("[PIX CREATE] 📍 Endereço formatado para Coldfy:", JSON.stringify(customer.address, null, 2))
    } else {
      console.warn("[PIX CREATE] ⚠️ Nenhum endereço fornecido pelo checkout")
    }

    // Build items array if provided
    const itemsArray = items && items.length > 0 
      ? items.map((item: any) => ({
          name: item.name || `Kit ${kitId || "Panini Copa 2026"}`,
          quantity: item.quantity || 1,
          price: Math.round((item.price || amount) * 100),
        }))
      : [
          {
            name: `Kit ${kitId || "Panini Copa 2026"}`,
            quantity: 1,
            price: Math.round(amount * 100),
          },
        ]

    const requestBody: any = {
      amount: Math.round(amount * 100),
      paymentMethod: "pix",
      customer,
    }

    // Add items if provided
    if (itemsArray && itemsArray.length > 0) {
      requestBody.items = itemsArray
    }
    
    console.log("[PIX CREATE] 🔍 CPF limpo:", cleanDocument, "Tamanho:", cleanDocument.length)
    
    // Log address before sending
    if (customer.address) {
      console.log("[PIX CREATE] 📍📍📍 ENDEREÇO QUE SERÁ ENVIADO PARA COLDFY 📍📍📍")
      console.log("[PIX CREATE] 📍 Rua:", customer.address.street)
      console.log("[PIX CREATE] 📍 Número:", customer.address.streetNumber)
      console.log("[PIX CREATE] 📍 Complemento:", customer.address.complement)
      console.log("[PIX CREATE] 📍 CEP:", customer.address.zipCode)
      console.log("[PIX CREATE] 📍 Bairro:", customer.address.neighborhood)
      console.log("[PIX CREATE] 📍 Cidade:", customer.address.city)
      console.log("[PIX CREATE] 📍 Estado:", customer.address.state)
      console.log("[PIX CREATE] 📍 Endereço completo:", JSON.stringify(customer.address, null, 2))
    } else {
      console.warn("[PIX CREATE] ⚠️⚠️⚠️ ATENÇÃO: NENHUM ENDEREÇO SERÁ ENVIADO! ⚠️⚠️⚠️")
    }

    console.log("[PIX CREATE] 📤 Request body completo:", JSON.stringify(requestBody, null, 2))

    const response = await fetch("https://api.coldfypay.com/functions/v1/transactions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()
    console.log("[PIX CREATE] 📥 Coldfy response status:", response.status)
    console.log("[PIX CREATE] 📥 Coldfy response:", responseText)

    // Parse response to check status even if not ok
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      // If not JSON, handle as error
      if (!response.ok) {
        console.error("[PIX CREATE] ❌❌❌ ERRO NA API COLDFY ❌❌❌")
        console.error("[PIX CREATE] ❌ Status:", response.status)
        console.error("[PIX CREATE] ❌ Response:", responseText)
        return NextResponse.json(
          { error: "Failed to create PIX transaction", details: responseText },
          { status: response.status },
        )
      }
    }

    // Parse response data
    const data = responseData || (response.ok ? JSON.parse(responseText) : null)

    if (!response.ok && !data) {
      console.error("[PIX CREATE] ❌❌❌ ERRO NA API COLDFY ❌❌❌")
      console.error("[PIX CREATE] ❌ Status:", response.status)
      console.error("[PIX CREATE] ❌ Response:", responseText)
      return NextResponse.json(
        { error: "Failed to create PIX transaction", details: responseText },
        { status: response.status },
      )
    }

    // Log response data
    console.log("[PIX CREATE] 📥 Transaction ID:", data?.id)
    console.log("[PIX CREATE] 📥 Status:", data?.status)
    console.log("[PIX CREATE] 📥 Full response:", JSON.stringify(data, null, 2))
    console.log("[PIX CREATE] 📥 PIX object:", JSON.stringify(data?.pix, null, 2))
    
    // Log address returned by Coldfy to compare
    if (data?.customer?.address) {
      console.log("[PIX CREATE] 📍📍📍 ENDEREÇO RETORNADO PELA COLDFY 📍📍📍")
      console.log("[PIX CREATE] 📍 Endereço retornado:", JSON.stringify(data.customer.address, null, 2))
    }
    if (data?.shipping) {
      console.log("[PIX CREATE] 📍📍📍 SHIPPING RETORNADO PELA COLDFY 📍📍📍")
      console.log("[PIX CREATE] 📍 Shipping retornado:", JSON.stringify(data.shipping, null, 2))
    }

    // Check if transaction was refused
    if (data && data.status === "refused") {
      console.error("[PIX CREATE] ❌❌❌ TRANSAÇÃO RECUSADA PELA COLDFY/BLUPAY ❌❌❌")
      console.error("[PIX CREATE] ❌ Status:", data.status)
      console.error("[PIX CREATE] ❌ Motivo:", data.refusedReason?.description || "Não especificado")
      console.error("[PIX CREATE] ❌ Código:", data.refusedReason?.acquirerCode)
      
      // Even if refused, check if there's a PIX code (sometimes it's generated before refusal)
      const pixCode = data.pix?.qrcode
      if (pixCode) {
        console.log("[PIX CREATE] ⚠️ Transação recusada, mas código PIX existe:", pixCode.substring(0, 50) + "...")
        // Continue processing to return the PIX code
      } else {
        return NextResponse.json(
          { 
            error: "Transaction refused by Coldfy/Blupay", 
            details: data.refusedReason?.description || "Transaction validation failed",
            status: data.status,
            refusedReason: data.refusedReason,
            transactionId: data.id,
          },
          { status: 400 },
        )
      }
    }

    if (!response.ok && !data) {
      console.error("[PIX CREATE] ❌❌❌ ERRO NA API COLDFY ❌❌❌")
      console.error("[PIX CREATE] ❌ Status:", response.status)
      console.error("[PIX CREATE] ❌ Response:", responseText)
      return NextResponse.json(
        { error: "Failed to create PIX transaction", details: responseText },
        { status: response.status },
      )
    }

    if (!data) {
      console.error("[PIX CREATE] ❌ Erro ao parsear JSON")
      return NextResponse.json(
        { error: "Invalid JSON response from Coldfy", details: responseText },
        { status: 500 },
      )
    }

    console.log("[PIX CREATE] ✅✅✅ Transação criada na Coldfy ✅✅✅")
    console.log("[PIX CREATE] Transaction ID:", data.id)
    console.log("[PIX CREATE] Status:", data.status)

    const pixCode = data.pix?.qrcode
    console.log("[PIX CREATE] 🔍 Extracted PIX code:", pixCode ? pixCode.substring(0, 100) + "..." : "NÃO ENCONTRADO")
    
    if (!pixCode) {
      console.error("[PIX CREATE] ❌❌❌ CÓDIGO PIX NÃO ENCONTRADO! ❌❌❌")
      console.error("[PIX CREATE] ❌ Status da transação:", data.status)
      console.error("[PIX CREATE] ❌ Estrutura completa:", JSON.stringify(data, null, 2))
      
      // If transaction was refused, return specific error
      if (data.status === "refused") {
        return NextResponse.json(
          { 
            error: "Transaction refused - PIX code not generated", 
            details: data.refusedReason?.description || "Transaction was refused by the payment gateway",
            status: data.status,
            refusedReason: data.refusedReason,
            transactionId: data.id,
          },
          { status: 400 },
        )
      }
      
      return NextResponse.json(
        { 
          error: "PIX code not found in response", 
          details: "A resposta da Coldfy não contém o código PIX. Status: " + data.status,
          response: data,
        },
        { status: 500 },
      )
    }

    const pixQrCodeUrl = pixCode
      ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`
      : undefined

    try {
      console.log("[PIX CREATE] 💾 Salvando UTM params para transactionId:", data.id)
      console.log("[PIX CREATE] 💾 UTM Params completos:", JSON.stringify(trackingParameters, null, 2))

      const saveResponse = await fetch(`${request.nextUrl.origin}/api/payment-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: String(data.id),
          status: "pending",
          utmParams: trackingParameters,
        }),
      })
      const saveResult = await saveResponse.json()
      console.log("[PIX CREATE] ✅ UTM params saved to payment-status:", saveResult)
    } catch (error) {
      console.error("[PIX CREATE] ❌ Failed to save UTM params:", error)
    }

    try {
      const productName = `Kit ${kitId || "Panini Copa 2026"}`

      const utmifyData: TransactionData = {
        orderId: String(data.id),
        amount: amount,
        customerName,
        customerEmail,
        customerDocument,
        customerPhone,
        productName,
        createdAt: new Date(),
        utmSource: trackingParameters?.utm_source || trackingParameters?.src,
        utmMedium: trackingParameters?.utm_medium,
        utmCampaign: trackingParameters?.utm_campaign,
        utmContent: trackingParameters?.utm_content,
        utmTerm: trackingParameters?.utm_term,
      }

      console.log("[PIX CREATE] 📤 Sending to UTMify (pending):", JSON.stringify(utmifyData, null, 2))
      await sendUtmifyPendingEvent(utmifyData)
      console.log("[PIX CREATE] ✅ UTMify pending event sent successfully")
    } catch (utmifyError) {
      console.error("[PIX CREATE] ❌ Failed to send UTMify pending event:", utmifyError)
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
    console.error("[PIX CREATE] ❌ Error creating PIX:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
