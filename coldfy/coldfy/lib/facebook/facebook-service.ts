export async function sendFacebookCheckoutEvent(transaction: any, fbParams?: any): Promise<void> {
  try {
    console.log("[v0] 📤 Enviando evento Checkout para Facebook")
    // Implementação simplificada - pode ser expandida depois
  } catch (error: any) {
    console.error("[v0] ❌ Erro ao enviar evento Checkout:", error.message)
  }
}

export async function sendFacebookPurchaseEvent(transaction: any, fbParams?: any): Promise<void> {
  try {
    console.log("[v0] 📤 Enviando evento Purchase para Facebook")
    // Implementação simplificada - pode ser expandida depois
  } catch (error: any) {
    console.error("[v0] ❌ Erro ao enviar evento Purchase:", error.message)
  }
}
