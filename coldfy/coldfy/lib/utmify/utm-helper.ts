export function getUTMParams() {
  if (typeof window === "undefined") return {}

  try {
    const utmParamsStr = localStorage.getItem("wepink_utm_params")
    console.log("[v0] Reading UTM params from localStorage:", utmParamsStr)
    if (utmParamsStr) {
      const params = JSON.parse(utmParamsStr)
      console.log("[v0] Parsed UTM params:", params)
      return params
    }
  } catch (error) {
    console.error("[v0] Erro ao obter UTM params:", error)
  }

  console.log("[v0] No UTM params found in localStorage")
  return {}
}
