"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckoutContent } from "@/components/checkout-content";
import { usePageViewTracking, usePreserveUTMParams } from "@/hooks/use-utm-tracking";

function CheckoutInner() {
  const searchParams = useSearchParams();
  const kitId = searchParams.get("kit") || "campeao";
  
  // Preserve UTM params in URL
  usePreserveUTMParams();
  
  // Track checkout page view
  usePageViewTracking("Checkout");
  
  return <CheckoutContent kitId={kitId} />;
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-foreground/60">Carregando...</p>
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}
