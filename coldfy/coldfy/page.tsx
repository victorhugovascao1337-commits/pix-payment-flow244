"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CartManager } from "@/lib/cart-manager"
import { UTMStatusIndicator } from "@/components/utm-status-indicator"

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cartCount, setCartCount] = useState(0)
  const [cartManager, setCartManager] = useState<CartManager | null>(null)
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 10,
    seconds: 0,
  })

  useEffect(() => {
    console.log("[v0] 📍 ===== INICIANDO CAPTURA DE UTMs =====")
    console.log("[v0] Full URL:", window.location.href)

    const utmParams: Record<string, string> = {}
    let hasUTMParams = false

    // Capturar todos os parâmetros da URL
    searchParams.forEach((value, key) => {
      console.log(`[v0] 🔍 Found URL param: ${key} = ${value}`)
      utmParams[key] = value
      if (key.startsWith("utm_") || key === "src" || key === "sck") {
        hasUTMParams = true
        console.log(`[v0] ✅ UTM Parameter detected: ${key}`)
      }
    })

    // Adicionar referrer e landing page
    if (typeof window !== "undefined") {
      if (document.referrer) {
        utmParams.referrer = document.referrer
        console.log("[v0] 📄 Referrer:", document.referrer)
      }
      utmParams.landing_page = window.location.href
      console.log("[v0] 🌐 Landing page:", window.location.href)

      // Capturar parâmetros do Facebook de cookies (se disponíveis)
      try {
        if ((window as any).utmify && typeof (window as any).utmify.getParams === "function") {
          const utmifyParams = (window as any).utmify.getParams()
          if (utmifyParams) {
            console.log("[v0] 📱 UTMify params found:", utmifyParams)
            if (utmifyParams.fbp) {
              utmParams.fbp = utmifyParams.fbp
              console.log("[v0] ✅ FBP captured:", utmifyParams.fbp)
            }
            if (utmifyParams.fbc) {
              utmParams.fbc = utmifyParams.fbc
              console.log("[v0] ✅ FBC captured:", utmifyParams.fbc)
            }
            if (utmifyParams.fbclid) {
              utmParams.fbclid = utmifyParams.fbclid
              console.log("[v0] ✅ FBCLID captured:", utmifyParams.fbclid)
            }
          }
        }
      } catch (error) {
        console.log("[v0] ⏳ UTMify ainda não carregou, parâmetros do Facebook serão capturados depois")
      }
    }

    console.log("[v0] 📦 All captured params:", JSON.stringify(utmParams, null, 2))

    if (hasUTMParams) {
      console.log("[v0] ✅✅✅ UTM parameters FOUND! Saving to localStorage...")
      localStorage.setItem("utm_params", JSON.stringify(utmParams))
      console.log("[v0] 💾 UTM params successfully saved to localStorage")
    } else {
      console.log("[v0] ⚠️⚠️⚠️ NO UTM parameters in URL!")
      console.log("[v0] 💡 To track campaigns, add UTM parameters to the URL: ?utm_source=test&utm_campaign=test")
      // Still save referrer and landing page
      if (Object.keys(utmParams).length > 0) {
        localStorage.setItem("utm_params", JSON.stringify(utmParams))
        console.log("[v0] 💾 Saved referrer and landing page data")
      }
    }

    console.log("[v0] 📍 ===== CAPTURA DE UTMs CONCLUÍDA =====")

    // Aguardar o script do UTMify carregar e atualizar os parâmetros do Facebook
    const updateFacebookParams = () => {
      try {
        if ((window as any).utmify && typeof (window as any).utmify.getParams === "function") {
          const utmifyParams = (window as any).utmify.getParams()
          const currentParams = JSON.parse(localStorage.getItem("utm_params") || "{}")

          let updated = false
          if (utmifyParams?.fbp && !currentParams.fbp) {
            currentParams.fbp = utmifyParams.fbp
            updated = true
          }
          if (utmifyParams?.fbc && !currentParams.fbc) {
            currentParams.fbc = utmifyParams.fbc
            updated = true
          }
          if (utmifyParams?.fbclid && !currentParams.fbclid) {
            currentParams.fbclid = utmifyParams.fbclid
            updated = true
          }

          if (updated) {
            localStorage.setItem("utm_params", JSON.stringify(currentParams))
            console.log("[v0] ✅ Parâmetros do Facebook atualizados no localStorage")
          }
        }
      } catch (error) {
        // Ignorar erros silenciosamente
      }
    }

    // Tentar atualizar após 2 e 5 segundos
    setTimeout(updateFacebookParams, 2000)
    setTimeout(updateFacebookParams, 5000)
  }, [searchParams])

  useEffect(() => {
    const manager = new CartManager()
    setCartManager(manager)
    setCartCount(manager.getItemCount())

    const countdownDate = new Date().getTime() + 10 * 60 * 1000

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const distance = countdownDate - now

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      if (distance < 0) {
        clearInterval(interval)
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
      } else {
        setTimeLeft({ hours, minutes, seconds })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleAddToCart = (product: any) => {
    if (!cartManager) return

    const priceNum = Number.parseFloat(product.price.replace("R$", "").replace(",", "."))
    const oldPriceNum = product.originalPrice
      ? Number.parseFloat(product.originalPrice.replace("R$", "").replace(",", "."))
      : undefined

    cartManager.addItem({
      id: product.id,
      name: product.title,
      price: priceNum,
      oldPrice: oldPriceNum,
      image: product.image,
    })

    setCartCount(cartManager.getItemCount())

    // Mark product as added
    setAddedProducts((prev) => new Set(prev).add(product.id))

    // Remove the green state after 2 seconds
    setTimeout(() => {
      setAddedProducts((prev) => {
        const newSet = new Set(prev)
        newSet.delete(product.id)
        return newSet
      })
    }, 2000)

    router.push("/carrinho")
  }

  const products = [
    {
      id: "345cd84f-71b2-11f0-bb47-46da4690ad53",
      badge: "EXCLUSIVO",
      image: "/images/superkit1_0.webp",
      title: "Kit Bloquinho da Vivibora VF e 5 Body Splash",
      originalPrice: "R$459,90",
      price: "R$69,90",
      badgeColor: "bg-[#FF0080]",
    },
    {
      id: "525dca75-71b2-11f0-bb47-46da4690ad53",
      badge: "EXCLUSIVO",
      image: "/images/superkit2_0.webp",
      title: "Kit Bloquinho da Vivibora VF Bloom e 5 Body Splash",
      originalPrice: "R$459,90",
      price: "R$69,90",
      badgeColor: "bg-[#FF0080]",
    },
    {
      id: "7d06cfeb-71b2-11f0-bb47-46da4690ad53",
      badge: "70% OFF",
      image: "/images/supermarry.webp",
      title: "Kit Merry Christmas e 5 Body Splash",
      originalPrice: "R$319,90",
      price: "R$59,90",
      badgeColor: "bg-[#FF0080]",
    },
    {
      id: "90e373c9-71b2-11f0-bb47-46da4690ad53",
      badge: "70% OFF",
      image: "/images/superaqua.webp",
      title: "Kit VF Aqua e 5 Body Splash",
      originalPrice: "R$319,90",
      price: "R$59,90",
      badgeColor: "bg-[#FF0080]",
    },
    {
      id: "a1b2c3d4-71b2-11f0-bb47-46da4690ad53",
      badge: "70% OFF",
      image: "/images/Heaven-100-ml-5-body-splash-Wepink.webp",
      title: "Heaven 100 ml e 5 Body Splash",
      originalPrice: "R$280,90",
      price: "R$54,90",
      badgeColor: "bg-[#FF0080]",
    },
    {
      id: "e5f6g7h8-71b2-11f0-bb47-46da4690ad53",
      badge: "70% OFF",
      image: "/images/Obsessed-100-ml-5-body-splash-Wepink.webp",
      title: "Obsessed 100 ml e 5 Body Splash",
      originalPrice: "R$280,90",
      price: "R$54,90",
      badgeColor: "bg-[#FF0080]",
    },
  ]

  const productsBottom = [
    {
      id: "b1c2d3e4-71b2-11f0-bb47-46da4690ad53",
      badge: "70% OFF",
      image: "/images/redmirage_0.webp",
      title: "Red Mirage 100 ml e 5 Body Splash",
      originalPrice: "R$219,90",
      price: "R$49,90",
      badgeColor: "bg-[#FF0080]",
    },
    {
      id: "c2d3e4f5-71b2-11f0-bb47-46da4690ad53",
      badge: "70% OFF",
      image: "/images/queenpink_0.webp",
      title: "Queen Pink 100ml e 5 Body Splash",
      originalPrice: "R$219,90",
      price: "R$49,90",
      badgeColor: "bg-[#FF0080]",
    },
    {
      id: "d3e4f5g6-71b2-11f0-bb47-46da4690ad53",
      badge: "70% OFF",
      image: "/images/thesunny_0.webp",
      title: "The Sunny 75 ml e 5 Body Splash",
      originalPrice: "R$219,90",
      price: "R$49,90",
      badgeColor: "bg-[#FF0080]",
    },
    {
      id: "e4f5g6h7-71b2-11f0-bb47-46da4690ad53",
      badge: "70% OFF",
      image: "/images/fatalblack_0.webp",
      title: "Fatal Black 100 ml e 5 Body Splash",
      originalPrice: "R$219,90",
      price: "R$49,90",
      badgeColor: "bg-[#FF0080]",
    },
    {
      id: "f5g6h7i8-71b2-11f0-bb47-46da4690ad53",
      badge: "70% OFF",
      image: "/images/Perfect-Pear-100-ml-5-body-splash-Wepink.webp",
      title: "Perfect Pear 100 ml e 5 Body Splash",
      originalPrice: "R$219,90",
      price: "R$47,90",
      badgeColor: "bg-[#FF0080]",
    },
    {
      id: "g6h7i8j9-71b2-11f0-bb47-46da4690ad53",
      badge: "70% OFF",
      image: "/images/Infinity-Star-75-ml-5-body-splash-Wepink.webp",
      title: "Infinity Star 75 ml e 5 Body Splash",
      originalPrice: "R$219,90",
      price: "R$47,90",
      badgeColor: "bg-[#FF0080]",
    },
    {
      id: "h7i8j9k0-71b2-11f0-bb47-46da4690ad53",
      badge: "70% OFF",
      image: "/images/One-Touch-100-ml-5-body-splash-Wepink-300x300.webp",
      title: "One Touch 100 ml e 5 Body Splash",
      originalPrice: "R$199,90",
      price: "R$47,90",
      badgeColor: "bg-[#FF0080]",
    },
    {
      id: "i8j9k0l1-71b2-11f0-bb47-46da4690ad53",
      badge: "70% OFF",
      image: "/images/Celebrate-100-ml-5-body-splash-Wepink-300x300.webp",
      title: "Celebrate 100 ml e 5 Body Splash",
      originalPrice: "R$199,90",
      price: "R$47,90",
      badgeColor: "bg-[#FF0080]",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <UTMStatusIndicator />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 shadow-md bg-[#FF0080]">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <button className="text-gray-800 lg:hidden cursor-pointer">
              <svg
                aria-hidden="true"
                className="w-6 h-6"
                viewBox="0 0 448 512"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
              >
                <path
                  className="text-card"
                  d="M432 416H16a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm0-128H16a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm0-128H16a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm0-128H16A16 16 0 0 0 0 48v16a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16z"
                ></path>
              </svg>
            </button>

            <div className="flex-1 flex justify-center lg:justify-start">
              <Image src="/images/wepink-logo.webp" alt="Wepink Logo" width={197} height={53} className="h-10 w-auto" />
            </div>

            <Link href="/carrinho" className="relative inline-block cursor-pointer text-gray-800">
              <svg
                aria-hidden="true"
                className="w-6 h-6"
                viewBox="0 0 576 512"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
              >
                <path
                  className="text-card"
                  d="M528.12 301.319l47.273-208C578.806 78.301 567.391 64 551.99 64H159.208l-9.166-44.81C147.758 8.021 137.93 0 126.529 0H24C10.745 0 0 10.745 0 24v16c0 13.255 10.745 24 24 24h69.883l70.248 343.435C147.325 417.1 136 435.222 136 456c0 30.928 25.072 56 56 56s56-25.072 56-56c0 15.674-6.447 29.835-16.824 40h209.647C430.447 426.165 424 440.326 424 456c0 30.928 25.072 56 56 56s56-25.072 56-56c0 22.172-12.888-41.332-31.579-50.405l5.517-24.276c3.413-15.018-8.002-29.319-23.403-29.319H218.117l-6.545-32h293.145c11.206 0 20.92-7.754 23.403-18.681z"
                ></path>
              </svg>
              {cartCount > 0 && (
                <span
                  className="absolute -top-2 -right-2 bg-[#FF0080] text-white rounded-full w-[22px] h-[22px] flex items-center justify-center text-xs font-bold"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Carousel */}
      <section>
        <div className="relative w-full overflow-hidden">
          <img
            src="/images/banner9.webp"
            alt="Wepink Fragrâncias - a partir de R$ 13,98"
            className="w-full h-auto object-contain leading-7 py-14"
          />
        </div>
      </section>

      {/* Countdown Timer */}
      <section className="bg-white py-8">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-gray-900 text-2xl md:text-3xl font-bold mb-6">A PROMOÇÃO ACABA EM:</h2>
          <div className="flex justify-center gap-4 md:gap-8">
            <div className="rounded-lg p-4 min-w-[80px] md:min-w-[100px] bg-[rgba(229,181,97,1)]">
              <div className="text-3xl md:text-5xl font-bold text-background">
                {timeLeft.hours.toString().padStart(2, "0")}
              </div>
              <div className="text-sm md:text-base mt-2 text-background">Horas</div>
            </div>
            <div className="rounded-lg p-4 min-w-[80px] md:min-w-[100px] bg-[rgba(229,181,97,1)] text-background">
              <div className="text-3xl md:text-5xl font-bold text-background">
                {timeLeft.minutes.toString().padStart(2, "0")}
              </div>
              <div className="text-sm md:text-base mt-2 text-background">Minutos</div>
            </div>
            <div className="rounded-lg p-4 min-w-[80px] md:min-w-[100px] bg-[rgba(229,181,97,1)]">
              <div className="text-3xl md:text-5xl font-bold text-background">
                {timeLeft.seconds.toString().padStart(2, "0")}
              </div>
              <div className="text-sm md:text-base mt-2 text-background">Segundos</div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-4xl mx-auto">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-200 relative"
              >
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10"></div>
                <div className="relative w-full aspect-square bg-white pt-2 px-2 sm:pt-4 sm:px-4 pb-4 sm:pb-8">
                  <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10">
                    <div
                      className={`${product.badgeColor} text-white px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-sm font-bold`}
                    >
                      {product.badge}
                    </div>
                  </div>
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-3 sm:p-6 text-center bg-white">
                  <h2 className="text-xs sm:text-lg font-bold text-gray-900 mb-2 sm:mb-4 min-h-[2.5rem] sm:min-h-[3rem] flex items-center justify-center leading-tight">
                    {product.title}
                  </h2>
                  {product.originalPrice && (
                    <h2 className="text-gray-400 line-through text-[10px] sm:text-base mb-1 sm:mb-2">
                      {product.originalPrice}
                    </h2>
                  )}
                  <h2 className="text-gray-900 text-xl sm:text-4xl font-bold mb-3 sm:mb-6">{product.price}</h2>
                  <button
                    className={`w-full font-bold py-2 sm:py-4 px-4 sm:px-8 text-xs sm:text-base rounded-lg transition-all shadow-md ${
                      addedProducts.has(product.id)
                        ? "bg-[#28a745] hover:bg-[#28a745] text-white"
                        : "bg-[#FF0080] hover:bg-[#E00070] text-white"
                    }`}
                    onClick={() => handleAddToCart(product)}
                    data-product-id={product.id}
                  >
                    {addedProducts.has(product.id) ? "ADICIONADO" : "COMPRAR"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kit 5 Body Splash Promotional Section */}
      <section className="pt-4 pb-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-white pt-6 px-6 pb-0 flex justify-center">
              <div className="bg-[#FF0080] text-white px-6 py-2 rounded-full text-sm font-bold">80% OFF</div>
            </div>
            <div className="p-6">
              <img
                src="/images/untitled-design-3-768x768.webp"
                alt="Kit 5 Body Splash"
                className="w-full h-auto object-contain"
              />
            </div>
            <div className="px-6 pb-6 text-center bg-gradient-to-b from-white to-pink-50">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">KIT 5 BODY SPLASH</h2>
              <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                uma essência mágica e elegante, que revela a ousadia de uma pele bem perfumada.
              </p>
              <h3 className="text-4xl font-bold text-[#FF0080] mb-6">R$39,90</h3>
              <button
                className={`w-full font-bold py-4 px-8 rounded-lg transition-all shadow-md ${
                  addedProducts.has("a278a1bd-71b2-11f0-bb47-46da4690ad53")
                    ? "bg-[#28a745] hover:bg-[#28a745] text-white"
                    : "bg-[#FF0080] hover:bg-[#E00070] text-white"
                }`}
                onClick={() =>
                  handleAddToCart({
                    id: "a278a1bd-71b2-11f0-bb47-46da4690ad53",
                    badge: "80% OFF",
                    image: "/images/untitled-design-3-768x768.webp",
                    title: "KIT 5 BODY SPLASH",
                    price: "R$39,90",
                    badgeColor: "bg-[#FF0080]",
                  })
                }
                data-product-id="a278a1bd-71b2-11f0-bb47-46da4690ad53"
              >
                {addedProducts.has("a278a1bd-71b2-11f0-bb47-46da4690ad53") ? "ADICIONADO" : "EU QUERO!"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-4xl mx-auto">
            {productsBottom.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-200 relative"
              >
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10"></div>
                <div className="relative w-full aspect-square bg-white pt-2 px-2 sm:pt-4 sm:px-4 pb-4 sm:pb-8">
                  <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10">
                    <div
                      className={`${product.badgeColor} text-white px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-sm font-bold`}
                    >
                      {product.badge}
                    </div>
                  </div>
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-3 sm:p-6 text-center bg-white">
                  <h2 className="text-xs sm:text-lg font-bold text-gray-900 mb-2 sm:mb-4 min-h-[2.5rem] sm:min-h-[3rem] flex items-center justify-center leading-tight">
                    {product.title}
                  </h2>
                  {product.originalPrice && (
                    <h2 className="text-gray-400 line-through text-[10px] sm:text-base mb-1 sm:mb-2">
                      {product.originalPrice}
                    </h2>
                  )}
                  <h2 className="text-gray-900 text-xl sm:text-4xl font-bold mb-3 sm:mb-6">{product.price}</h2>
                  <button
                    className={`w-full font-bold py-2 sm:py-4 px-4 sm:px-8 text-xs sm:text-base rounded-lg transition-all shadow-md ${
                      addedProducts.has(product.id)
                        ? "bg-[#28a745] hover:bg-[#28a745] text-white"
                        : "bg-[#FF0080] hover:bg-[#E00070] text-white"
                    }`}
                    onClick={() => handleAddToCart(product)}
                    data-product-id={product.id}
                  >
                    {addedProducts.has(product.id) ? "ADICIONADO" : "COMPRAR"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FF0080] py-12">
        <div className="container mx-auto px-4">
          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Logo and Links */}
            <div className="text-center md:text-left">
              <h2 className="text-white text-3xl font-bold mb-6">wepink</h2>
              <nav className="flex flex-col gap-2 items-center md:items-start">
                {[
                  "sobre nós",
                  "central de ajuda",
                  "solicitação de troca",
                  "solicitação de devolução",
                  "canais de atendimento",
                  "regulamentos",
                  "trabalhe conosco",
                  "cadê meu pedido",
                  "franquias",
                  "nossas lojas",
                  "TAC",
                ].map((link) => (
                  <a key={link} href="#" className="text-white text-sm hover:underline flex items-center gap-1">
                    {link} <span>→</span>
                  </a>
                ))}
              </nav>
            </div>

            {/* Social Media */}
            <div className="flex flex-col items-center order-2 md:order-none">
              <div className="flex gap-4 mb-8">
                <a
                  href="https://www.facebook.com/wepinkoficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 md:w-14 md:h-14 border-2 border-white rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="https://www.youtube.com/@wepinkoficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 md:w-14 md:h-14 border-2 border-white rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="flex flex-col items-center order-3 md:order-none md:items-end">
              <h3 className="text-white text-xl font-bold mb-4">Formas de pagamento</h3>
              <div className="flex flex-wrap gap-2 justify-center md:justify-end mb-4">
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-[#1A1F71] font-bold text-xs">VISA</span>
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <svg className="w-8 h-6" viewBox="0 0 38 24">
                    <circle cx="12" cy="12" r="10" fill="#EB001B" />
                    <circle cx="26" cy="12" r="10" fill="#F79E1B" />
                    <path d="M19 4a10 10 0 0 0 0 16 10 10 0 0 0 0-16z" fill="#FF5F00" />
                  </svg>
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#0079BE" strokeWidth="2" />
                    <path d="M8 7v10M16 7v10" stroke="#0079BE" strokeWidth="2" />
                  </svg>
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-[#006FCF] font-bold text-[8px]">AMEX</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <svg className="w-10 h-10 text-white mb-1" viewBox="0 0 512 512" fill="currentColor">
                  <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.9 231.1 518.9 200.8 488.6L103.3 391.2H112.6C132.6 391.2 151.5 383.4 165.7 369.2L242.4 292.5zM262.5 218.9C257.1 224.4 247.9 224.4 242.4 218.9L165.7 142.2C151.5 128 132.6 120.2 112.6 120.2H103.3L200.2 23.3C230.4-6.9 279.6-6.9 309.9 23.3L407 120.4H392.6C372.6 120.4 353.7 128.2 339.5 142.4L262.5 218.9zM112.6 142.7C126.4 142.7 139.1 148.3 148.7 157.9L225.4 234.6C233.6 242.8 244.8 247.3 256.4 247.3C267.9 247.3 279.2 242.8 287.4 234.6L364.1 157.9C373.7 148.3 386.5 142.7 400.2 142.7H429.1L488.6 202.2C518.9 232.4 518.9 281.6 488.6 311.9L429.7 370.8H400.2C386.5 370.8 373.7 365.2 364.1 355.6L287.4 278.9C279.2 270.7 267.9 266.2 256.4 266.2C244.8 266.2 233.6 270.7 225.4 278.9L148.7 355.6C139.1 365.2 126.4 370.8 112.6 370.8H82.7L23.3 311.4C-6.9 281.1-6.9 231.9 23.3 201.6L82 142.7H112.6z" />
                </svg>
                <span className="text-white text-sm">Pix</span>
              </div>
            </div>
          </div>

          {/* Back to Top Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
            >
              <span className="w-8 h-8 border-2 border-white rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </span>
              <span className="text-sm">voltar ao topo</span>
            </button>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-white/20 pt-6 text-center">
            <div className="flex justify-center gap-4 text-white text-sm mb-6">
              <a href="#" className="hover:underline">
                Política de Privacidade
              </a>
              <span>|</span>
              <a href="#" className="hover:underline">
                Termos de Uso
              </a>
            </div>
            <div className="text-white text-xs space-y-2 opacity-90">
              <p>Todos os direitos reservados © 2025 | SAVI COSMÉTICOS LTDA | CNPJ: 29.449.999/0001-32</p>
              <p>Avenida Jabaquara, 2080 - Mirandópolis - São Paulo/SP - CEP: 04046-400</p>
              <p>Atendimento por whatsapp: +55 (11) 99556-4258 | Horário todos os dias das 07:00 às 21:30</p>
              <p>Atendimento por telefone: 0800-1000-146 | Horário: todos os dias das 08:00 às 20:00</p>
              <p>
                Atendimento por e-mail:{" "}
                <a href="mailto:atendimento@wepink.com.br" className="underline hover:opacity-80">
                  atendimento@wepink.com.br
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
