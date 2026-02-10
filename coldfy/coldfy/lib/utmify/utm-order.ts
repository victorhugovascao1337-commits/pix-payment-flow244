export async function sendUTMifyOrder(
  status: "waiting_payment" | "paid" | "refused",
  transactionId: string,
  amount: number,
  userData: { nome: string; cpf: string },
): Promise<void> {
  try {
    console.log("[v0] 📤 Enviando ordem UTMify - Status:", status, "TransactionId:", transactionId)
    // Implementação simplificada - pode ser expandida depois
  } catch (error: any) {
    console.error("[v0] ❌ Erro ao enviar ordem UTMify:", error.message)
  }
}
