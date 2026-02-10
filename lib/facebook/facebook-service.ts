export async function sendFacebookCheckoutEvent(transaction: any, fbParams?: any): Promise<void> {
  try {
    console.log("[FACEBOOK SERVICE] 📤 Enviando evento Checkout para Facebook")
    // Implementação para eventos server-side se necessário
    // Por enquanto, usamos apenas o client-side tracking
  } catch (error: any) {
    console.error("[FACEBOOK SERVICE] ❌ Erro ao enviar evento Checkout:", error.message)
  }
}

export async function sendFacebookPurchaseEvent(transaction: any, fbParams?: any): Promise<void> {
  try {
    console.log("[FACEBOOK SERVICE] 📤 Enviando evento Purchase para Facebook")
    // Implementação para eventos server-side se necessário
    // Por enquanto, usamos apenas o client-side tracking
  } catch (error: any) {
    console.error("[FACEBOOK SERVICE] ❌ Erro ao enviar evento Purchase:", error.message)
  }
}

