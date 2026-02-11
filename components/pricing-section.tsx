"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getUTMParams, buildURLWithUTM } from "@/lib/utmify/utm-helper";
import { trackFacebookInitiateCheckout, trackFacebookAddToCart } from "@/lib/facebook/facebook-client";

const kits = [
  {
    id: "basico",
    name: "Kit Básico",
    description: "1 Álbum Capa Dura + 10 Pacotes",
    stickers: 50,
    oldPrice: "R$ 99,90",
    newPrice: "R$ 59,00",
    discount: "-41%",
    savings: "Você economiza R$ 40,90",
    checkoutUrl: "https://seguro.paninilojas.com/checkout/Z-11LMK02CZW26",
    badge: null,
    badgeColor: "",
  },
  {
    id: "iniciante",
    name: "Kit Iniciante",
    description: "1 Álbum Capa Dura + 30 Pacotes",
    stickers: 150,
    oldPrice: "R$ 139,90",
    newPrice: "R$ 79,00",
    discount: "-44%",
    savings: "Você economiza R$ 60,90",
    checkoutUrl: "https://seguro.paninilojas.com/checkout/Z-11MC102VLN26",
    badge: null,
    badgeColor: "",
  },
  {
    id: "campeao",
    name: "Kit Campeão",
    description: "1 Álbum Capa Dura + 60 Pacotes",
    stickers: 300,
    oldPrice: "R$ 249,90",
    newPrice: "R$ 149,00",
    discount: "-40%",
    savings: "Você economiza R$ 100,90",
    checkoutUrl: "https://seguro.paninilojas.com/checkout/Z-115V602CSY26",
    badge: "MAIS VENDIDO",
    badgeColor: "bg-[#2d8c3c]",
  },
  {
    id: "colecionador",
    name: "Kit Colecionador",
    description: "1 Álbum Capa Dura + 90 Pacotes",
    stickers: 450,
    oldPrice: "R$ 349,90",
    newPrice: "R$ 199,00",
    discount: "-43%",
    savings: "Você economiza R$ 150,90",
    checkoutUrl: "https://seguro.paninilojas.com/checkout/Z-117P902H9626",
    badge: "MELHOR CUSTO",
    badgeColor: "bg-[#d4a017]",
  },
];

export function PricingSection() {
  const [selected, setSelected] = useState("colecionador");
  const router = useRouter();

  return (
    <section className="px-4 py-8">
      <h2 className="mb-1 text-xl font-bold text-foreground sm:text-2xl">
        Escolha seu Kit
      </h2>
      <p className="mb-6 text-sm text-foreground/60">
        {"Quanto mais pacotes, mais chances de completar o álbum"}
      </p>

      <div className="flex flex-col gap-4">
        {kits.map((kit) => (
          <button
            key={kit.id}
            type="button"
            onClick={() => setSelected(kit.id)}
            className={`relative w-full rounded-xl border-2 bg-card p-4 text-left transition-all ${selected === kit.id
              ? "border-[#2d8c3c] shadow-lg"
              : "border-border"
              }`}
          >
            {/* Discount badge top right */}
            <span className="absolute -right-1 -top-3 rounded-full bg-[#e74c3c] px-2.5 py-1 text-xs font-bold text-white">
              {kit.discount}
            </span>

            <div className="flex items-start gap-2">
              {/* Radio */}
              <div className="mt-1 flex-shrink-0">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${selected === kit.id
                    ? "border-[#2d8c3c]"
                    : "border-foreground/30"
                    }`}
                >
                  {selected === kit.id && (
                    <div className="h-3 w-3 rounded-full bg-[#2d8c3c]" />
                  )}
                </div>
              </div>

              {/* Product image */}
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg sm:h-16 sm:w-16">
                <Image
                  src="/images/product.webp"
                  alt={kit.name}
                  width={64}
                  height={64}
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {kit.badge && (
                    <span
                      className={`${kit.badgeColor} whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-bold uppercase text-white`}
                    >
                      {kit.badge}
                    </span>
                  )}
                </div>
                <h3 className="mt-1 whitespace-nowrap text-sm font-bold text-foreground sm:text-base">
                  {kit.name}
                </h3>
                <p className="text-[11px] text-foreground/60 sm:text-xs">{kit.description}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:mt-2 sm:gap-2">
                  <span className="whitespace-nowrap rounded-full bg-[#e8f5e9] px-2 py-0.5 text-[10px] font-medium text-[#2d8c3c] sm:px-2.5 sm:text-xs">
                    {kit.stickers} figurinhas
                  </span>
                  <span className="whitespace-nowrap rounded-full bg-[#e8f5e9] px-2 py-0.5 text-[10px] font-medium text-[#2d8c3c] sm:px-2.5 sm:text-xs">
                    {"Frete Grátis"}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex-shrink-0 text-right">
                <p className="text-[10px] text-[#ef4444] line-through sm:text-xs">
                  {kit.oldPrice}
                </p>
                <p className="text-lg font-extrabold text-foreground sm:text-xl">
                  {kit.newPrice}
                </p>
                <p className="text-[10px] font-semibold text-[#16a34a]">via PIX</p>
              </div>
            </div>

            <p className="mt-3 text-xs font-semibold text-[#2d8c3c]">
              {kit.savings}
            </p>
          </button>
        ))}
      </div>

      {/* CTA Button */}
      <button
        type="button"
        onClick={() => {
          // Track InitiateCheckout event
          const utmParams = getUTMParams();
          const selectedKit = kits.find(k => k.id === selected);

          console.log("[UTMIFY] 🛒 InitiateCheckout - Kit:", selectedKit?.name, "UTM:", utmParams);

          // Extract price from string (e.g., "R$ 119,90" -> 119.90)
          const priceStr = selectedKit?.newPrice.replace("R$ ", "").replace(",", ".") || "0";
          const price = parseFloat(priceStr);

          // Track Facebook InitiateCheckout
          trackFacebookInitiateCheckout(price, "BRL", 1);

          // Track AddToCart
          trackFacebookAddToCart(price, "BRL", selectedKit?.name);

          // Track click event
          if (typeof window !== "undefined" && (window as any).utmify) {
            try {
              (window as any).utmify.track("InitiateCheckout", {
                kit: selectedKit?.name,
                price: selectedKit?.newPrice,
                utm_source: utmParams.utm_source || utmParams.src,
                utm_campaign: utmParams.utm_campaign,
              });
            } catch (error) {
              console.error("[UTMIFY] Erro ao trackear InitiateCheckout:", error);
            }
          }

          // Redirect to external checkout URL in same tab
          if (selectedKit?.checkoutUrl) {
            window.location.href = selectedKit.checkoutUrl;
          }
        }}
        className="mt-6 w-full rounded-xl bg-[#2d8c3c] px-6 py-4 text-base font-extrabold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-[#236e30] active:scale-[0.98]"
      >
        GARANTIR MEU KIT AGORA
      </button>
    </section>
  );
}
