"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { CartManager, type Cart } from "@/lib/cart-manager"

export default function PixPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 })
  const [cartManager, setCartManager] = useState<CartManager | null>(null)
  const [pixCode, setPixCode] = useState("")
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [timeRemaining, setTimeRemaining] = useState(3600)
  const [copied, setCopied] = useState(false)
  const [transactionId, setTransactionId] = useState<string>("")
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    const manager = new CartManager()
    setCartManager(manager)
    const currentCart = manager.getCart()
    setCart(currentCart)

    const code = searchParams.get("code") || ""
    const qrcode = searchParams.get("qrcode") || ""
    const txId = searchParams.get("transactionId") || ""

    if (currentCart.items.length === 0) {
      router.push("/carrinho")
      return
    }

    if (code && qrcode) {
      setPixCode(code)
      setQrCodeUrl(qrcode)
      if (txId) {
        setTransactionId(txId)
      }
    } else {
      const mockPixCode = `00020126580014br.gov.bcb.pix2536${Math.random().toString(36).substring(2, 15)}52040000530398654${(currentCart.total / 100).toFixed(2)}5802BR5913WEPINK BRASIL6009SAO PAULO62070503***63044B8A`
      setPixCode(mockPixCode)
      const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(mockPixCode)}`
      setQrCodeUrl(qrCodeApiUrl)
    }
  }, [])

  useEffect(() => {
    if (!transactionId || timeRemaining <= 0) return

    const checkPaymentStatus = async () => {
      if (isChecking) return

      setIsChecking(true)
      try {
        const response = await fetch(`/api/payment-status?transactionId=${transactionId}`)
        const data = await response.json()

        if (data.paid && data.status === "paid") {
          
          // Google Ads Conversion Tracking
          if (typeof window !== 'undefined' && (window as any).gtag) {
            const conversionValue = cart.total / 100;
            (window as any).gtag('event', 'conversion', {
              'send_to': 'AW-696514603/ySMtCOzchugbEKvwj8wC',
              'value': conversionValue,
              'currency': 'BRL',
              'transaction_id': transactionId
            });
          }
          
          // Facebook Pixel Purchase Event
          if (typeof window !== 'undefined' && (window as any).fbq) {
            const purchaseValue = cart.total / 100;
            (window as any).fbq('track', 'Purchase', {
              value: purchaseValue,
              currency: 'BRL',
              content_type: 'product',
              contents: cart.items.map(item => ({
                id: item.id,
                quantity: item.quantity
              }))
            });
          }

          // Clear cart
          if (cartManager) {
            cartManager.clearCart()
          }

          // Redirect to Typebot after a small delay to ensure tracking is sent
          setTimeout(() => {
            window.location.href = "https://typebot.co/tema-whatsapp-oghjgkm"
          }, 500)
        }
      } catch (error) {
        // Error checking payment status
      } finally {
        setIsChecking(false)
      }
    }

    // Check immediately
    checkPaymentStatus()

    // Then check every 3 seconds
    const interval = setInterval(checkPaymentStatus, 3000)

    return () => clearInterval(interval)
  }, [transactionId, timeRemaining, cartManager, isChecking])

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

  if (!cartManager) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-[600px] mx-auto px-4 py-4 flex justify-center">
          <Link href="/">
            <Image src="/images/logo-116625-1.webp" alt="Wepink" width={115} height={31} />
          </Link>
        </div>
      </header>

      <main className="max-w-[600px] mx-auto px-4 py-8">
        <div className="flex justify-center mb-4">
          <img src="/images/pix-20-281-29.png" alt="PIX" className="w-20 h-20" />
        </div>

        <div className="text-center mb-6">
          <p className="text-[#28a745] text-lg font-semibold">
            Tempo restante: <span className="font-bold">{formatTime(timeRemaining)}</span>
          </p>
          {transactionId && <p className="text-sm text-gray-500 mt-2">Aguardando confirmação do pagamento...</p>}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="bg-white rounded-lg p-6 mb-6 flex justify-center">
            <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code PIX" className="w-[250px] h-[250px]" />
          </div>

          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Escaneie o código com seu celular</h3>
            <p className="text-gray-600 text-sm">Abra o app do seu banco, escolha Pix e aponte a câmera</p>
          </div>

          <div className="bg-[#FFF9E6] border-l-4 border-[#FFC107] rounded-lg p-4 mb-4">
            <p className="font-bold text-gray-800 mb-2">Ou copie o código PIX:</p>
            <div className="bg-white border border-gray-300 rounded p-3 mb-3 break-all text-sm text-gray-700">
              {pixCode}
            </div>
            <button
              onClick={handleCopyCode}
              className={`w-full ${copied ? "bg-[#28a745]" : "bg-[#28a745] hover:bg-[#20a037]"} text-white font-bold py-3 px-6 rounded-lg transition-all`}
            >
              {copied ? "✓ Código Copiado!" : "Copiar Código PIX"}
            </button>
          </div>

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
              <span className="text-[#28a745] text-2xl font-bold">{cartManager.formatPrice(cart.total)}</span>
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
