"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Copy, Check, Loader2 } from "lucide-react"
import { getUTMParams, buildURLWithUTM } from "@/lib/utmify/utm-helper"
import { usePageViewTracking, usePreserveUTMParams } from "@/hooks/use-utm-tracking"
import { trackFacebookPurchase } from "@/lib/facebook/facebook-client"

function PixPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [copied, setCopied] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(30 * 60) // 30 minutos
  const [isChecking, setIsChecking] = useState(false)

  const orderId = searchParams.get("orderId") || searchParams.get("transactionId") || ""
  const amount = parseFloat(searchParams.get("amount") || "0")
  const kitId = searchParams.get("kit") || "campeao"
  const pixCodeParam = searchParams.get("code") || ""
  const qrCodeUrlParam = searchParams.get("qrcode") || ""

  const [pixCode, setPixCode] = useState(pixCodeParam || "")
  const [qrCodeUrl, setQrCodeUrl] = useState(qrCodeUrlParam || "")
  const [isLoadingPix, setIsLoadingPix] = useState(!pixCodeParam && !!orderId)

  // Initialize PIX code from URL params immediately
  useEffect(() => {
    if (pixCodeParam) {
      console.log("[PIX] ✅ Código PIX recebido via URL:", pixCodeParam.substring(0, 50) + "...")
      setPixCode(pixCodeParam)
      if (qrCodeUrlParam) {
        setQrCodeUrl(qrCodeUrlParam)
      } else if (pixCodeParam) {
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCodeParam)}`)
      }
      setIsLoadingPix(false)
    }
  }, [pixCodeParam, qrCodeUrlParam])

  // Preserve UTM params in URL
  usePreserveUTMParams()

  // Track PIX page view
  usePageViewTracking("PIX Payment Page")

  // Fetch PIX code from Coldfy if not provided in URL
  useEffect(() => {
    if (!orderId || pixCodeParam) {
      // Already have code or no orderId, skip
      if (pixCodeParam) {
        setIsLoadingPix(false)
      }
      return
    }

    const fetchPixCode = async () => {
      setIsLoadingPix(true)
      try {
        console.log("[PIX] 🔍 Buscando código PIX da transação:", orderId)

        // Use our API to get PIX code (server-side will call Coldfy)
        const apiResponse = await fetch(`/api/pix/get?transactionId=${orderId}`)

        if (apiResponse.ok) {
          const apiData = await apiResponse.json()
          if (apiData.pixCode) {
            console.log("[PIX] ✅ Código PIX obtido:", apiData.pixCode.substring(0, 50) + "...")
            setPixCode(apiData.pixCode)
            setQrCodeUrl(apiData.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(apiData.pixCode)}`)
            setIsLoadingPix(false)
            return
          } else {
            console.error("[PIX] ❌ Código PIX não encontrado na resposta da API")
          }
        } else {
          let errorData
          try {
            errorData = await apiResponse.json()
            console.error("[PIX] ❌ Erro ao buscar código PIX:", errorData)

            // If transaction was refused, show specific message
            if (errorData.status === "refused" || errorData.error?.includes("refused")) {
              console.error("[PIX] ❌ Transação foi recusada pelo gateway")
            }
          } catch (e) {
            errorData = { error: `Status ${apiResponse.status}`, status: apiResponse.status }
            console.error("[PIX] ❌ Erro ao buscar código PIX (parse error):", errorData)
          }
        }

        console.error("[PIX] ❌ Não foi possível obter código PIX da transação")
        setIsLoadingPix(false)
      } catch (error) {
        console.error("[PIX] ❌ Erro ao buscar código PIX:", error)
        setIsLoadingPix(false)
      }
    }

    fetchPixCode()
  }, [orderId, pixCodeParam])

  useEffect(() => {
    console.log("[UTMIFY] 💰 Página PIX carregada", { orderId, amount, hasPixCode: !!pixCode })
  }, [orderId, amount, pixCode])

  // Check payment status
  useEffect(() => {
    if (!orderId || timeRemaining <= 0) return

    const checkPaymentStatus = async () => {
      if (isChecking) return

      setIsChecking(true)
      try {
        // Verificar status do pagamento via API
        const response = await fetch(`/api/payment-status?orderId=${orderId}`)
        const data = await response.json()

        if (data.paid && data.status === "paid") {
          console.log("[UTMIFY] ✅ Pagamento aprovado!")

          const utmParams = getUTMParams()

          // Send paid event to UTMFY
          const utmifyResponse = await fetch("/api/utmify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId,
              status: "paid",
              amount,
              customer: {
                name: "",
                email: "",
                document: "",
                phone: "",
              },
              trackingParameters: {
                utm_source: utmParams.utm_source || utmParams.src || null,
                utm_medium: utmParams.utm_medium || null,
                utm_campaign: utmParams.utm_campaign || null,
                utm_content: utmParams.utm_content || null,
                utm_term: utmParams.utm_term || null,
                src: utmParams.src || utmParams.utm_source || null,
                sck: utmParams.sck || null,
              },
              productName: `Kit ${kitId}`,
            }),
          })

          if (utmifyResponse.ok) {
            console.log("[UTMIFY] ✅✅✅ Evento PAID enviado com sucesso!")

            // Track Facebook Purchase event
            trackFacebookPurchase(amount, "BRL", orderId, [
              {
                id: kitId,
                quantity: 1,
              },
            ])

            // Redirect to thank you page with UTM params
            const successUrl = buildURLWithUTM("/obrigado", { orderId });
            router.push(successUrl)
          }
        }
      } catch (error) {
        console.error("[UTMIFY] ❌ Erro ao verificar pagamento:", error)
      } finally {
        setIsChecking(false)
      }
    }

    // Check every 5 seconds
    const interval = setInterval(checkPaymentStatus, 5000)

    return () => clearInterval(interval)
  }, [orderId, timeRemaining, isChecking, amount, kitId, router])

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-[600px] mx-auto px-4 py-4 flex justify-center">
          <Link href="/">
            <Image
              src="/images/logo-panini-256.png"
              alt="Panini Logo"
              width={150}
              height={54}
              style={{ width: "auto", height: "auto" }}
            />
          </Link>
        </div>
      </header>

      <main className="max-w-[600px] mx-auto px-4 py-8">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-[#32BCAD] rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">PIX</span>
          </div>
        </div>

        <div className="text-center mb-6">
          <p className="text-[#28a745] text-lg font-semibold">
            Tempo restante: <span className="font-bold">{formatTime(timeRemaining)}</span>
          </p>
          {orderId && (
            <p className="text-sm text-gray-500 mt-2">
              Aguardando confirmação do pagamento...
            </p>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="bg-white rounded-lg p-6 mb-6 flex justify-center">
            {isLoadingPix ? (
              <div className="w-[250px] h-[250px] flex items-center justify-center border border-gray-300 rounded-lg">
                <Loader2 className="w-12 h-12 animate-spin text-[#32BCAD]" />
              </div>
            ) : pixCode ? (
              <img
                src={qrCodeUrl}
                alt="QR Code PIX"
                className="w-[250px] h-[250px] border border-gray-300 rounded-lg"
              />
            ) : (
              <div className="w-[250px] h-[250px] flex items-center justify-center border border-gray-300 rounded-lg bg-red-50">
                <p className="text-red-600 text-sm text-center px-4">
                  Erro ao carregar código PIX. Por favor, tente novamente.
                </p>
              </div>
            )}
          </div>

          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Escaneie o código com seu celular
            </h3>
            <p className="text-gray-600 text-sm">
              Abra o app do seu banco, escolha PIX e aponte a câmera
            </p>
          </div>

          {pixCode && (
            <div className="bg-[#FFF9E6] border-l-4 border-[#FFC107] rounded-lg p-4 mb-4">
              <p className="font-bold text-gray-800 mb-2">Ou copie o código PIX:</p>
              <div className="bg-white border border-gray-300 rounded p-3 mb-3 break-all text-sm text-gray-700">
                {pixCode}
              </div>
              <button
                onClick={handleCopyCode}
                disabled={!pixCode}
                className={`w-full ${copied ? "bg-[#28a745]" : "bg-[#28a745] hover:bg-[#20a037]"
                  } text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Código Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copiar Código PIX
                  </>
                )}
              </button>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <ol className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Copie o código acima</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>Abra o app do seu banco</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>Escolha PIX {">"} Colar Código</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>Confirme o pagamento</span>
              </li>
            </ol>
          </div>

          <div className="border-t border-gray-300 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-semibold">Valor da compra:</span>
              <span className="text-[#28a745] text-2xl font-bold">
                R$ {amount.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <span>🔒</span> Compra 100% Segura
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PixPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-[#32BCAD]" />
        </div>
      }
    >
      <PixPageContent />
    </Suspense>
  )
}

