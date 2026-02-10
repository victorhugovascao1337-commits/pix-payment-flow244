"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Minus,
  Plus,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
  Pencil,
  Trash2,
  Copy,
  QrCode,
  Smartphone,
  ClipboardList,
} from "lucide-react";
import { getUTMParams, buildURLWithUTM } from "@/lib/utmify/utm-helper";
import { usePageViewTracking } from "@/hooks/use-utm-tracking";
import { trackFacebookAddPaymentInfo } from "@/lib/facebook/facebook-client";

const kitsData: Record<
  string,
  {
    name: string;
    description: string;
    price: number;
    oldPrice: string;
  }
> = {
  basico: {
    name: "Kit Básico",
    description: "1 Álbum Capa Dura + 10 Pacotes",
    price: 39.9,
    oldPrice: "R$ 69,90",
  },
  iniciante: {
    name: "Kit Iniciante",
    description: "1 Álbum Capa Dura + 30 Pacotes",
    price: 59.9,
    oldPrice: "R$ 109,90",
  },
  campeao: {
    name: "Kit Campeão",
    description: "1 Álbum Capa Dura + 60 Pacotes",
    price: 97.9,
    oldPrice: "R$ 175,90",
  },
  colecionador: {
    name: "Kit Colecionador",
    description: "1 Álbum Capa Dura + 90 Pacotes",
    price: 119.9,
    oldPrice: "R$ 267,90",
  },
};

function formatBRL(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function CheckoutContent({ kitId }: { kitId: string }) {
  const router = useRouter();
  const kit = kitsData[kitId] || kitsData.campeao;
  const [quantity, setQuantity] = useState(1);
  const [resumoOpen, setResumoOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Track checkout page view
  usePageViewTracking("Checkout Page");

  // Step 1 fields
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [celular, setCelular] = useState("");

  // Step 2 fields
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [complemento, setComplemento] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [cepLoaded, setCepLoaded] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");
  const [addressSaved, setAddressSaved] = useState(false);
  const [shippingOption, setShippingOption] = useState<"gratis" | "expresso">("gratis");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");

  // Step 3 fields
  const [upsellAdded, setUpsellAdded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixGenerated, setPixGenerated] = useState(false);
  const [countdown, setCountdown] = useState(30 * 60); // 30 minutes in seconds
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  const pixCode = "00020126880014br.gov.bcb.pix2566opsqrc.com.br/pix/v2/cobv/12345678-abcd-efgh-ijkl-1234567890ab5204000053039865802BR5925PANINI BRASIL LTDA6014SAO PAULO SP62070503***6304A1B2";

  const handleComprarAgora = useCallback(async () => {
    setIsProcessing(true);
    
    // Get UTM params
    const utmParams = getUTMParams();
    
    // Generate order ID
    const orderId = `panini-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const totalAmount = (kit.price * quantity) + (upsellAdded ? upsellPrice : 0);
    
    console.log("[UTMIFY] 💳 Iniciando pagamento PIX", {
      orderId,
      amount: totalAmount,
      kit: kit.name,
      utmParams,
    });
    
    // Track Facebook AddPaymentInfo
    trackFacebookAddPaymentInfo(totalAmount, "BRL");
    
    try {
      // Prepare address data from form
      const addressData = {
        street: endereco || "",
        streetNumber: numero || "S/N",
        complement: complemento || "",
        zipCode: cep ? cep.replace(/\D/g, "") : "",
        neighborhood: bairro || "",
        city: cidade || "",
        state: uf || "",
        country: "BR",
      };
      
      console.log("[PIX] 📍 Endereço coletado do formulário:", JSON.stringify(addressData, null, 2));
      console.log("[PIX] 📍 Campos individuais:", {
        endereco,
        numero,
        complemento,
        cep,
        bairro,
        cidade,
        uf,
      });
      
      // Create PIX via Coldfy API
      const pixResponse = await fetch("/api/pix/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: totalAmount,
          customerName: nome,
          customerEmail: email,
          customerDocument: cpf,
          customerPhone: celular,
          kitId: kitId,
          // Address information - use the address filled by the user
          customerAddress: addressData,
          // Items information
          items: [
            {
              name: kit.name,
              quantity: quantity,
              price: kit.price,
            },
          ],
          trackingParameters: {
            utm_source: utmParams.utm_source || utmParams.src || null,
            utm_medium: utmParams.utm_medium || null,
            utm_campaign: utmParams.utm_campaign || null,
            utm_content: utmParams.utm_content || null,
            utm_term: utmParams.utm_term || null,
            src: utmParams.src || utmParams.utm_source || null,
            sck: utmParams.sck || null,
          },
        }),
      });
      
      if (pixResponse.ok) {
        const pixData = await pixResponse.json();
        console.log("[PIX] ✅ PIX criado com sucesso:", pixData);
        console.log("[PIX] 📋 Dados recebidos:", {
          transactionId: pixData.transactionId,
          pixCode: pixData.pixCode ? pixData.pixCode.substring(0, 50) + "..." : "NÃO ENCONTRADO",
          pixQrCode: pixData.pixQrCode ? "Presente" : "Não presente",
          success: pixData.success,
          isMock: pixData.isMock,
        });
        
        // Validate that we have the PIX code
        if (!pixData.pixCode) {
          console.error("[PIX] ❌❌❌ CÓDIGO PIX NÃO ENCONTRADO NA RESPOSTA! ❌❌❌");
          console.error("[PIX] ❌ Resposta completa:", JSON.stringify(pixData, null, 2));
          alert("Erro: Código PIX não foi gerado. Por favor, tente novamente.");
          setIsProcessing(false);
          return;
        }
        
        setIsProcessing(false);
        
        // Redirect to PIX page with real data and UTM params
        // Always use transactionId as orderId, and pass pixCode if available
        const pixUrl = buildURLWithUTM("/pix", {
          orderId: pixData.transactionId || orderId,
          amount: totalAmount.toString(),
          kit: kitId,
          code: pixData.pixCode || "",
          qrcode: pixData.pixQrCode || pixData.pixQrCodeUrl || "",
        });
        
        console.log("[PIX] 🔗 Redirecionando para:", pixUrl);
        router.push(pixUrl);
      } else {
        // Get error details from response
        let errorMessage = "Erro desconhecido";
        let errorDetails: any = {};
        let responseText = "";
        
        try {
          responseText = await pixResponse.text();
          console.log("[PIX] ❌ Status da resposta:", pixResponse.status);
          console.log("[PIX] ❌ Resposta raw da API:", responseText);
          console.log("[PIX] ❌ Tamanho da resposta:", responseText.length);
          
          // Try to parse as JSON
          if (responseText && responseText.trim().length > 0) {
            try {
              errorDetails = JSON.parse(responseText);
              console.log("[PIX] ❌ JSON parseado com sucesso");
              console.log("[PIX] ❌ Keys do objeto:", Object.keys(errorDetails));
              
              // Extract error message from various possible fields
              errorMessage = errorDetails.error || 
                            errorDetails.message || 
                            errorDetails.details || 
                            (typeof errorDetails === 'string' ? errorDetails : `Status ${pixResponse.status}`);
              
              console.error("[PIX] ❌ Erro ao criar PIX - Detalhes parseados:", JSON.stringify(errorDetails, null, 2));
            } catch (parseError) {
              // If not JSON, use text as error message
              console.log("[PIX] ❌ Não é JSON válido, usando texto como mensagem");
              errorMessage = responseText || `Status ${pixResponse.status}`;
              errorDetails = { 
                raw: responseText, 
                status: pixResponse.status,
                parseError: parseError instanceof Error ? parseError.message : String(parseError)
              };
              console.error("[PIX] ❌ Erro ao criar PIX - Resposta não é JSON:", responseText);
            }
          } else {
            // Empty response
            errorMessage = `Erro na API (Status: ${pixResponse.status})`;
            errorDetails = { status: pixResponse.status, empty: true };
            console.error("[PIX] ❌ Resposta vazia da API");
          }
          
          // Check if transaction was refused
          const isRefused = errorDetails.status === "refused" || 
                           errorMessage.toLowerCase().includes("refused") || 
                           errorMessage.toLowerCase().includes("recusada") ||
                           errorMessage.toLowerCase().includes("validation failed");
          
          if (isRefused) {
            const refusedReason = errorDetails.refusedReason?.description || 
                                 errorDetails.details || 
                                 errorMessage || 
                                 "Transação recusada pelo gateway de pagamento";
            
            console.error("[PIX] ❌❌❌ TRANSAÇÃO RECUSADA ❌❌❌");
            console.error("[PIX] ❌ Motivo:", refusedReason);
            console.error("[PIX] ❌ Status:", errorDetails.status);
            console.error("[PIX] ❌ Detalhes completos:", JSON.stringify(errorDetails, null, 2));
            
            alert(`Transação recusada: ${refusedReason}\n\nPor favor, verifique:\n- Se o CPF está correto\n- Se os dados estão completos\n- Tente novamente em alguns instantes`);
            setIsProcessing(false);
            return;
          }
        } catch (e) {
          console.error("[PIX] ❌ Erro ao processar resposta de erro:", e);
          errorMessage = `Erro ao processar resposta (Status: ${pixResponse.status})`;
          errorDetails = { 
            error: e instanceof Error ? e.message : String(e),
            status: pixResponse.status 
          };
        }
        
        console.error("[PIX] ❌ Erro ao criar PIX:", errorMessage);
        console.error("[PIX] ❌ Detalhes completos:", errorDetails);
        alert(`Erro ao gerar PIX: ${errorMessage}\n\nPor favor, tente novamente.`);
        setIsProcessing(false);
        
        // Fallback: redirect anyway with mock data and UTM params
        const fallbackPixUrl = buildURLWithUTM("/pix", {
          orderId,
          amount: totalAmount.toString(),
          kit: kitId,
        });
        router.push(fallbackPixUrl);
      }
    } catch (error) {
      console.error("[PIX] ❌ Erro ao criar PIX:", error);
      setIsProcessing(false);
      // Fallback: redirect anyway with mock data
      router.push(`/pix?orderId=${orderId}&amount=${totalAmount}&kit=${kitId}`);
    }
  }, [kit, quantity, upsellAdded, nome, email, cpf, celular, router, kitId]);

  useEffect(() => {
    if (!pixGenerated) return;
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pixGenerated, countdown]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const upsellPrice = 39.9;

  const fetchCepData = useCallback(async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setCepLoading(true);
    setCepError("");

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();

      if (data.erro) {
        setCepError("CEP não encontrado.");
        setCepLoaded(false);
      } else {
        setCepLoaded(true);
        setEndereco(data.logradouro || "");
        setBairro(data.bairro || "");
        setComplemento(data.complemento || "");
        setCidade(data.localidade || "");
        setUf(data.uf || "");
        setDestinatario(nome);
        console.log("[CEP] ✅ Endereço preenchido automaticamente:", {
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          uf: data.uf,
        });
      }
    } catch {
      setCepError("Erro ao buscar CEP. Tente novamente.");
      setCepLoaded(false);
    } finally {
      setCepLoading(false);
    }
  }, [nome]);

  // Auto-fetch CEP when it reaches 8 digits
  useEffect(() => {
    const cleanCep = cep.replace(/\D/g, "");
    // Only fetch if CEP is complete (8 digits), not already loaded, and not currently loading
    if (cleanCep.length === 8 && !cepLoaded && !cepLoading) {
      console.log("[CEP] 🔍 CEP completo detectado, buscando endereço automaticamente...");
      // Use a small delay to avoid multiple calls while user is still typing
      const timeoutId = setTimeout(() => {
        fetchCepData(cep);
      }, 300); // 300ms delay to debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [cep, cepLoaded, cepLoading, fetchCepData]);

  const handleCepBlur = async () => {
    // Also trigger on blur as fallback
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8 && !cepLoaded) {
      await fetchCepData(cep);
    }
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length > 5) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return digits;
  };

  const isFieldValid = (value: string) => value.trim().length > 0;

  // Validation
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!nome.trim()) errors.nome = "Preencha seu nome completo";
    if (!email.trim() || !email.includes("@")) errors.email = "Preencha um e-mail valido";
    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11) errors.cpf = "Preencha um CPF valido";
    const celDigits = celular.replace(/\D/g, "");
    if (celDigits.length < 10) errors.celular = "Preencha um celular valido";
    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2Address = () => {
    const errors: Record<string, string> = {};
    if (!numero.trim()) errors.numero = "Obrigatorio";
    if (!endereco.trim()) errors.endereco = "Obrigatorio";
    if (!bairro.trim()) errors.bairro = "Obrigatorio";
    if (!destinatario.trim()) errors.destinatario = "Obrigatorio";
    setStep2Errors(errors);
    return Object.keys(errors).length === 0;
  };

  // CPF formatting: 000.000.000-00
  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  // Phone formatting: (00)0 0000-0000
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : "";
    if (digits.length <= 3) return `(${digits.slice(0, 2)})${digits.slice(2)}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)})${digits.slice(2, 3)} ${digits.slice(3)}`;
    return `(${digits.slice(0, 2)})${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  // Email suggestions
  const emailDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "msn.com"];
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const getEmailSuggestions = () => {
    if (!email || email.includes("@")) {
      // If already has @ and domain, filter by what they typed
      if (email.includes("@")) {
        const [local, domainPart] = email.split("@");
        if (!local) return [];
        return emailDomains
          .filter((d) => d.startsWith(domainPart || ""))
          .map((d) => `${local}@${d}`);
      }
      return [];
    }
    return emailDomains.map((d) => `${email}@${d}`);
  };

  const emailSuggestions = getEmailSuggestions();

  const subtotal = kit.price * quantity;
  const shippingCost = shippingOption === "expresso" ? 12.5 : 0;
  const pixDiscount = subtotal * 0.05;
  const total = subtotal - pixDiscount + shippingCost;

  const steps = [
    { number: 1, label: "Informações pessoais" },
    { number: 2, label: "Entrega" },
    { number: 3, label: "Pagamento" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between bg-card px-4 py-3 shadow-sm lg:px-8">
        <Link href="/">
          <Image
            src="/images/logo-panini-256.png"
            alt="Panini Logo"
            width={120}
            height={43}
            style={{ width: "auto", height: "auto" }}
            priority
          />
        </Link>
        <div className="flex items-center gap-1.5">
          <Lock className="h-4 w-4 text-foreground/70" />
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wide text-foreground">
              Pagamento
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground/60">
              100% Seguro
            </p>
          </div>
        </div>
      </header>

      {/* PIX Discount Banner */}
      <div className="bg-[#3a3a3a] px-4 py-2.5 text-center">
        <p className="text-sm font-semibold text-white">
          Aproveite + 5% de desconto no Pix !
        </p>
      </div>

      {/* Banner Image Placeholder */}
      <div className="flex items-center justify-center bg-white px-4 py-8 lg:py-12">
        <div className="relative h-48 w-full max-w-lg overflow-hidden rounded-2xl bg-white lg:h-72">
          <Image
            src="/images/checkout-banner.jpg"
            alt="FIFA World Cup 2026"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Mobile: Step Indicators */}
      <div className="px-4 py-4 lg:hidden">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={step.number} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {i > 0 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      currentStep > i ? "bg-[#2d8c3c]" : "bg-border"
                    }`}
                  />
                )}
                <div
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    currentStep >= step.number
                      ? "bg-[#2d8c3c] text-white"
                      : "bg-border text-foreground/40"
                  }`}
                >
                  {step.number}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      currentStep > step.number ? "bg-[#2d8c3c]" : "bg-border"
                    }`}
                  />
                )}
              </div>
              <p
                className={`mt-1.5 text-center text-[10px] leading-tight ${
                  currentStep >= step.number
                    ? "font-semibold text-foreground"
                    : "text-foreground/40"
                }`}
              >
                {step.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Resumo Collapsible */}
      <div className="px-4 pb-2 lg:hidden">
        <button
          type="button"
          onClick={() => setResumoOpen(!resumoOpen)}
          className="flex w-full items-center justify-between rounded-t-xl border border-border bg-card px-4 py-3"
        >
          <span className="text-sm font-bold uppercase tracking-wide text-foreground">
            Resumo
          </span>
          {resumoOpen ? (
            <ChevronUp className="h-5 w-5 text-foreground/60" />
          ) : (
            <ChevronDown className="h-5 w-5 text-foreground/60" />
          )}
        </button>
        {resumoOpen && (
          <div className="rounded-b-xl border border-t-0 border-border bg-card px-4 pb-4">
            {/* Product */}
            <div className="flex items-center gap-3 py-3">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                <Image
                  src="/images/product.webp"
                  alt={kit.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {kit.name}
                </p>
                <p className="text-xs text-foreground/60">
                  Qtd.: {quantity} &nbsp;&nbsp; {formatBRL(kit.price)}
                </p>
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-center gap-4 rounded-lg bg-muted px-4 py-2">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-border"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-base font-bold text-[#2d8c3c]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-border"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Remove */}
            <p className="mt-2 text-center text-xs text-[#2d8c3c] underline">
              <button type="button" onClick={() => setQuantity(1)}>
                Remover produto
              </button>
            </p>

            {/* Price Breakdown */}
            <div className="mt-4 rounded-xl border border-border bg-muted/50 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/70">Produto</span>
                <span className="font-semibold text-foreground">
                  {formatBRL(subtotal)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-foreground/70">Frete</span>
                <span className={`font-semibold ${shippingCost === 0 ? "text-[#2d8c3c]" : "text-foreground"}`}>
                  {shippingCost === 0 ? "Gratis" : formatBRL(shippingCost)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-foreground/70">Desconto no PIX</span>
                <span className="font-semibold text-[#2d8c3c]">
                  -{formatBRL(pixDiscount)}
                </span>
              </div>
              <div className="mt-2 border-t border-border pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#2d8c3c]">Total</span>
                  <span className="text-lg font-extrabold text-[#2d8c3c]">
                    {formatBRL(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop + Mobile Form Layout */}
      <div className="mx-auto max-w-6xl px-4 py-6 lg:flex lg:gap-6">
        {/* Left Column: Steps */}
        <div className="flex-1 lg:flex lg:gap-6">
          <div className="flex flex-1 flex-col gap-4">
            {/* Step 1: Identifique-se */}
            <div className="rounded-xl border border-border bg-card p-5 lg:p-6">
              <div className="mb-3 flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${currentStep >= 1 ? "bg-[#2d8c3c] text-white" : "bg-border text-foreground/40"}`}>
                  1
                </div>
                <h2 className={`text-lg font-bold ${currentStep >= 1 ? "text-foreground" : "text-foreground/40"}`}>
                  Identifique-se
                </h2>
              </div>

              {currentStep === 1 ? (
                <>
                  <p className="mb-5 text-xs leading-relaxed text-foreground/60">
                    {"Utilizaremos seu e-mail para: identificar seu perfil, histórico de compra, notificação de pedidos e carrinho de compras."}
                  </p>

                  {/* Form Fields */}
                  <div className="flex flex-col gap-4">
                    <div>
                      <label htmlFor="nome" className="mb-1 block text-xs font-medium text-foreground/70">
                        Nome completo
                      </label>
                      <input
                        id="nome"
                        type="text"
                        value={nome}
                        onChange={(e) => {
                          setNome(e.target.value);
                          if (step1Errors.nome) setStep1Errors((prev) => { const n = {...prev}; delete n.nome; return n; });
                        }}
                        placeholder="ex.: Maria de Almeida Cruz"
                        className={`w-full rounded-lg border px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-1 ${
                          step1Errors.nome
                            ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
                            : "border-border bg-card focus:border-[#2d8c3c] focus:ring-[#2d8c3c]"
                        }`}
                      />
                      {step1Errors.nome && (
                        <p className="mt-1 text-xs text-red-500">{step1Errors.nome}</p>
                      )}
                    </div>
                    <div className="relative">
                      <label htmlFor="email" className="mb-1 block text-xs font-medium text-foreground/70">
                        E-mail
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setShowEmailSuggestions(true);
                          if (step1Errors.email) setStep1Errors((prev) => { const n = {...prev}; delete n.email; return n; });
                        }}
                        onFocus={() => {
                          setEmailFocused(true);
                          if (email.length > 0) setShowEmailSuggestions(true);
                        }}
                        onBlur={() => {
                          setEmailFocused(false);
                          setTimeout(() => setShowEmailSuggestions(false), 200);
                        }}
                        placeholder="seu@email.com"
                        autoComplete="off"
                        className={`w-full rounded-lg border px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-1 ${
                          step1Errors.email
                            ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
                            : "border-border bg-card focus:border-[#2d8c3c] focus:ring-[#2d8c3c]"
                        }`}
                      />
                      {step1Errors.email && (
                        <p className="mt-1 text-xs text-red-500">{step1Errors.email}</p>
                      )}
                      {/* Email Suggestions Dropdown */}
                      {showEmailSuggestions && emailSuggestions.length > 0 && emailFocused && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                          {emailSuggestions.map((suggestion) => {
                            const isPopular = suggestion.endsWith("@gmail.com") || suggestion.endsWith("@hotmail.com");
                            return (
                              <button
                                key={suggestion}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setEmail(suggestion);
                                  setShowEmailSuggestions(false);
                                }}
                                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
                              >
                                <span>{suggestion}</span>
                                {isPopular && (
                                  <Check className="h-4 w-4 flex-shrink-0 text-[#2d8c3c]" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="cpf" className="mb-1 block text-xs font-medium text-foreground/70">
                        CPF
                      </label>
                      <input
                        id="cpf"
                        type="text"
                        inputMode="numeric"
                        value={cpf}
                        onChange={(e) => {
                          setCpf(formatCpf(e.target.value));
                          if (step1Errors.cpf) setStep1Errors((prev) => { const n = {...prev}; delete n.cpf; return n; });
                        }}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className={`w-full rounded-lg border px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-1 lg:max-w-[240px] ${
                          step1Errors.cpf
                            ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
                            : "border-border bg-card focus:border-[#2d8c3c] focus:ring-[#2d8c3c]"
                        }`}
                      />
                      {step1Errors.cpf && (
                        <p className="mt-1 text-xs text-red-500">{step1Errors.cpf}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="celular" className="mb-1 block text-xs font-medium text-foreground/70">
                        Celular / Whatsapp
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-3">
                          <span className="text-base">+55</span>
                          <ChevronDown className="h-3 w-3 text-foreground/40" />
                        </div>
                        <input
                          id="celular"
                          type="tel"
                          inputMode="numeric"
                          value={celular}
                          onChange={(e) => {
                            setCelular(formatPhone(e.target.value));
                            if (step1Errors.celular) setStep1Errors((prev) => { const n = {...prev}; delete n.celular; return n; });
                          }}
                          placeholder="(00)0 0000-0000"
                          maxLength={15}
                          className={`w-full rounded-lg border px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-1 ${
                            step1Errors.celular
                              ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
                              : "border-border bg-card focus:border-[#2d8c3c] focus:ring-[#2d8c3c]"
                          }`}
                        />
                      </div>
                      {step1Errors.celular && (
                        <p className="mt-1 text-xs text-red-500">{step1Errors.celular}</p>
                      )}
                    </div>
                  </div>

                  {/* PIX Discount Badge */}
                  <div className="mt-5 flex items-center gap-3 rounded-lg bg-[#f0fdf4] px-4 py-3">
                    <Image
                      src="/images/pix-icon.png"
                      alt="PIX"
                      width={32}
                      height={32}
                      style={{ width: "32px", height: "32px" }}
                      className="flex-shrink-0"
                    />
                    <p className="text-xs text-foreground/70">
                      {"Você ganhou "}
                      <span className="font-bold text-[#2d8c3c]">5% de desconto</span>
                      {" pagando com Pix"}
                    </p>
                  </div>

                  {/* Continue Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep1()) {
                        setCurrentStep(2);
                      }
                    }}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d8c3c] px-6 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-[#236e30] active:scale-[0.98]"
                  >
                    {"Continuar"}
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <p className="text-xs text-foreground/50">
                  {nome || "---"} &middot; {email || "---"}
                </p>
              )}
            </div>

            {/* Step 2: Entrega */}
            <div className="rounded-xl border border-border bg-card p-5 lg:p-6">
              <div className="mb-2 flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${currentStep >= 2 ? "bg-[#2d8c3c] text-white" : "bg-border text-foreground/40"}`}>
                  2
                </div>
                <h2 className={`text-lg font-bold ${currentStep >= 2 ? "text-foreground" : "text-foreground/40"}`}>
                  Entrega
                </h2>
              </div>

              {currentStep < 2 ? (
                <>
                  <p className="mb-4 text-xs text-foreground/40">
                    {"Preencha suas informações pessoais para continuar."}
                  </p>
                  <button
                    type="button"
                    disabled
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d8c3c]/50 px-6 py-3.5 text-sm font-bold text-white/70"
                  >
                    {"Editar"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              ) : currentStep === 2 ? (
                <>
                  <p className="mb-5 text-xs text-foreground/60">
                    {"Cadastre ou selecione um endereço"}
                  </p>

                  {/* CEP Field */}
                  <div className="mb-4">
                    <label htmlFor="cep" className="mb-1 block text-xs font-medium text-foreground/70">
                      CEP
                    </label>
                    <div className="relative">
                      <input
                        id="cep"
                        type="text"
                        value={cep}
                        onChange={(e) => {
                          const formatted = formatCep(e.target.value);
                          setCep(formatted);
                          setCepError("");
                          if (e.target.value.replace(/\D/g, "").length < 8) {
                            setCepLoaded(false);
                          }
                        }}
                        onBlur={handleCepBlur}
                        placeholder=""
                        className={`w-full rounded-lg border px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-1 lg:max-w-[240px] ${
                          cepLoaded
                            ? "border-[#2d8c3c] bg-[#f0fdf4] focus:border-[#2d8c3c] focus:ring-[#2d8c3c]"
                            : "border-border bg-card focus:border-[#2d8c3c] focus:ring-[#2d8c3c]"
                        }`}
                      />
                      {cepLoading && (
                        <div className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin rounded-full border-2 border-[#2d8c3c] border-t-transparent" />
                      )}
                      {cepLoaded && !cepLoading && (
                        <Check className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2d8c3c]" />
                      )}
                    </div>
                    {cepError && (
                      <p className="mt-1 text-xs text-red-500">{cepError}</p>
                    )}
                  </div>

                  {/* Address Fields - appear after CEP is loaded */}
                  {cepLoaded && (
                    <div className="flex flex-col gap-4">
                      {/* Endereco */}
                      <div>
                        <label htmlFor="endereco" className="mb-1 block text-xs font-medium text-foreground/70">
                          {"Endereço"}
                        </label>
                        <div className="relative">
                          <input
                            id="endereco"
                            type="text"
                            value={endereco}
                            onChange={(e) => setEndereco(e.target.value)}
                            className={`w-full rounded-lg border px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 ${
                              isFieldValid(endereco)
                                ? "border-[#2d8c3c] bg-[#f0fdf4] focus:border-[#2d8c3c] focus:ring-[#2d8c3c]"
                                : "border-border bg-card focus:border-[#2d8c3c] focus:ring-[#2d8c3c]"
                            }`}
                          />
                          {isFieldValid(endereco) && (
                            <Check className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2d8c3c]" />
                          )}
                        </div>
                      </div>

                      {/* Numero + Bairro */}
                      <div className="flex gap-3">
                        <div className="w-24 flex-shrink-0">
                          <label htmlFor="numero" className="mb-1 block text-xs font-medium text-foreground/70">
                            {"Número"}
                          </label>
                          <input
                            id="numero"
                            type="text"
                            value={numero}
                            onChange={(e) => {
                              setNumero(e.target.value);
                              if (step2Errors.numero) setStep2Errors((prev) => { const n = {...prev}; delete n.numero; return n; });
                            }}
                            className={`w-full rounded-lg border px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 ${
                              step2Errors.numero
                                ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
                                : "border-border bg-card focus:border-[#2d8c3c] focus:ring-[#2d8c3c]"
                            }`}
                          />
                          {step2Errors.numero && (
                            <p className="mt-1 text-xs text-red-500">{step2Errors.numero}</p>
                          )}
                        </div>
                        <div className="flex-1">
                          <label htmlFor="bairro" className="mb-1 block text-xs font-medium text-foreground/70">
                            Bairro
                          </label>
                          <div className="relative">
                            <input
                              id="bairro"
                              type="text"
                              value={bairro}
                              onChange={(e) => setBairro(e.target.value)}
                              className={`w-full rounded-lg border px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 ${
                                isFieldValid(bairro)
                                  ? "border-[#2d8c3c] bg-[#f0fdf4] focus:border-[#2d8c3c] focus:ring-[#2d8c3c]"
                                  : "border-border bg-card focus:border-[#2d8c3c] focus:ring-[#2d8c3c]"
                              }`}
                            />
                            {isFieldValid(bairro) && (
                              <Check className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2d8c3c]" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Complemento */}
                      <div>
                        <label htmlFor="complemento" className="mb-1 flex items-center gap-1 text-xs font-medium text-foreground/70">
                          Complemento <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-foreground/40">opcional</span>
                        </label>
                        <input
                          id="complemento"
                          type="text"
                          value={complemento}
                          onChange={(e) => setComplemento(e.target.value)}
                          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground focus:border-[#2d8c3c] focus:outline-none focus:ring-1 focus:ring-[#2d8c3c]"
                        />
                      </div>

                      {/* Destinatario */}
                      <div>
                        <label htmlFor="destinatario" className="mb-1 block text-xs font-medium text-foreground/70">
                          {"Destinatário"}
                        </label>
                        <div className="relative">
                          <input
                            id="destinatario"
                            type="text"
                            value={destinatario}
                            onChange={(e) => setDestinatario(e.target.value)}
                            className={`w-full rounded-lg border px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 ${
                              isFieldValid(destinatario)
                                ? "border-[#2d8c3c] bg-[#f0fdf4] focus:border-[#2d8c3c] focus:ring-[#2d8c3c]"
                                : "border-border bg-card focus:border-[#2d8c3c] focus:ring-[#2d8c3c]"
                            }`}
                          />
                          {isFieldValid(destinatario) && (
                            <Check className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2d8c3c]" />
                          )}
                        </div>
                      </div>

                      {/* Salvar Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (validateStep2Address()) {
                            setAddressSaved(true);
                          }
                        }}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d8c3c] px-6 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-[#236e30] active:scale-[0.98]"
                      >
                        Salvar
                      </button>
                    </div>
                  )}

                  {/* Address Saved + Shipping Options */}
                  {addressSaved && (
                    <>
                      {/* New Address Link */}
                      <p className="mb-3 text-sm font-semibold text-foreground">
                        + Novo {"endereço"}
                      </p>

                      {/* Saved Address Card */}
                      <div className="mb-5 flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
                        <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-foreground">
                          <div className="h-1.5 w-1.5 rounded-full bg-card" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {endereco}, {numero} - {bairro}
                          </p>
                          <p className="text-xs text-foreground/50">
                            {cidade} - {uf} | CEP {cep}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAddressSaved(false)}
                            className="flex h-7 w-7 items-center justify-center rounded text-foreground/40 transition-colors hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddressSaved(false);
                              setCepLoaded(false);
                              setCep("");
                              setEndereco("");
                              setNumero("");
                              setBairro("");
                              setComplemento("");
                              setDestinatario("");
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded text-foreground/40 transition-colors hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Shipping Options */}
                      <p className="mb-3 text-sm text-foreground/60">
                        Escolha uma forma de entrega:
                      </p>

                      <div className="flex flex-col gap-3">
                        {/* Free Shipping */}
                        <label
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                            shippingOption === "gratis"
                              ? "border-[#2d8c3c] bg-[#f0fdf4]"
                              : "border-border bg-card"
                          }`}
                        >
                          <input
                            type="radio"
                            name="shipping"
                            value="gratis"
                            checked={shippingOption === "gratis"}
                            onChange={() => setShippingOption("gratis")}
                            className="sr-only"
                          />
                          <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                            shippingOption === "gratis" ? "border-[#2d8c3c]" : "border-foreground/30"
                          }`}>
                            {shippingOption === "gratis" && (
                              <div className="h-2.5 w-2.5 rounded-full bg-[#2d8c3c]" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-foreground">
                              {"Frete Grátis"}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-foreground/60">5 dias</span>
                              <Image
                                src="/images/correios-logo.webp"
                                alt="Correios"
                                width={60}
                                height={16}
                                style={{ width: "auto", height: "14px" }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-bold text-[#2d8c3c]">
                            {"Grátis"}
                          </span>
                        </label>

                        {/* Express Shipping */}
                        <label
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                            shippingOption === "expresso"
                              ? "border-[#2d8c3c] bg-[#f0fdf4]"
                              : "border-border bg-card"
                          }`}
                        >
                          <input
                            type="radio"
                            name="shipping"
                            value="expresso"
                            checked={shippingOption === "expresso"}
                            onChange={() => setShippingOption("expresso")}
                            className="sr-only"
                          />
                          <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                            shippingOption === "expresso" ? "border-[#2d8c3c]" : "border-foreground/30"
                          }`}>
                            {shippingOption === "expresso" && (
                              <div className="h-2.5 w-2.5 rounded-full bg-[#2d8c3c]" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-foreground">
                              Frete Expresso
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-foreground/60">3 dias</span>
                              <Image
                                src="/images/correios-logo.webp"
                                alt="Correios"
                                width={60}
                                height={16}
                                style={{ width: "auto", height: "14px" }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-bold text-foreground">
                            R$ 12,50
                          </span>
                        </label>
                      </div>

                      {/* Continue Button */}
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d8c3c] px-6 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-[#236e30] active:scale-[0.98]"
                      >
                        {"Continuar"}
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <p className="text-xs text-foreground/50">
                  {endereco}, {numero} - {bairro} &middot; CEP {cep}
                </p>
              )}
            </div>

            {/* Step 3: Pagamento */}
            {!pixGenerated ? (
              <div className="rounded-xl border border-border bg-card p-5 lg:p-6">
                <div className="mb-2 flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${currentStep >= 3 ? "bg-[#2d8c3c] text-white" : "bg-border text-foreground/40"}`}>
                    3
                  </div>
                  <h2 className={`text-lg font-bold ${currentStep >= 3 ? "text-foreground" : "text-foreground/40"}`}>
                    Pagamento
                  </h2>
                </div>

                {currentStep < 3 ? (
                  <p className="text-xs text-foreground/40">
                    {"Escolha uma forma de pagamento"}
                  </p>
                ) : (
                  <>
                    <p className="mb-5 text-xs text-foreground/60">
                      {"Escolha uma forma de pagamento"}
                    </p>

                    {/* PIX Option (selected) */}
                    <div className="rounded-xl border-2 border-[#2d8c3c] bg-card p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#2d8c3c]">
                          <div className="h-2.5 w-2.5 rounded-full bg-[#2d8c3c]" />
                        </div>
                        <span className="text-sm font-bold text-foreground">Pix</span>
                      </div>
                      <p className="mb-3 text-xs leading-relaxed text-foreground/60">
                        {"A confirmação de pagamento é realizada em poucos minutos. Utilize o aplicativo do seu banco para pagar."}
                      </p>
                      <p className="text-sm font-semibold text-[#2d8c3c]">
                        {"Valor no pix: "}{formatBRL(total + (upsellAdded ? upsellPrice : 0))}
                      </p>

                      {/* Upsell Offer */}
                      <div className="mt-4 rounded-xl border-2 border-dashed border-[#e8a020] bg-[#fef9ee] p-4">
                        <p className="mb-3 text-center text-sm font-bold text-[#e8a020]">
                          {"OFERTA ESPECIAL"}
                        </p>

                        <div className="mb-3 flex items-center gap-3">
                          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-white">
                            <Image
                              src="/images/product.webp"
                              alt="2 Caixas de Figurinha"
                              width={48}
                              height={48}
                              className="h-12 w-12 object-contain"
                            />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground/80">
                              {"60 pacotes (300 figurinhas)"}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-foreground/40 line-through">
                                R$ 69,90
                              </span>
                              <span className="text-base font-bold text-foreground">
                                R$ 39,90
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setUpsellAdded(!upsellAdded)}
                          className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all ${
                            upsellAdded
                              ? "bg-[#2d8c3c] text-white"
                              : "bg-foreground/10 text-foreground/70"
                          }`}
                        >
                          {upsellAdded ? (
                            <>
                              <Check className="h-4 w-4" />
                              {"ADICIONADO"}
                            </>
                          ) : (
                            "ADICIONAR"
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Comprar Agora Button */}
                    <button
                      type="button"
                      onClick={handleComprarAgora}
                      disabled={isProcessing}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d8c3c] px-6 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-[#236e30] active:scale-[0.98] disabled:opacity-70"
                    >
                      {isProcessing ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          {"Processando pagamento..."}
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          {"Comprar agora"}
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* PIX Generated Success Screen */
              <div className="rounded-xl border border-border bg-card p-5 lg:p-6">
                {/* Header */}
                <div className="mb-4 text-center">
                  <h2 className="text-xl font-extrabold text-[#2d8c3c]">
                    Pix gerado com sucesso
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/60">
                    {"Estamos aguardando o pagamento! Após realizar o pagamento, aguarde nesta tela para confirmar seu pedido."}
                  </p>
                </div>

                {/* Countdown Timer */}
                <div className="mb-4 text-center">
                  <p className="text-5xl font-extrabold tracking-tight text-foreground">
                    {formatCountdown(countdown)}
                  </p>
                  <p className="mt-1 text-xs text-foreground/50">
                    {"Tempo para conclusão da operação"}
                  </p>
                </div>

                {/* PIX Copia e Cola Label */}
                <p className="mb-3 text-center text-sm text-foreground/70">
                  {"Pague através do código "}
                  <span className="font-bold text-foreground">PIX copia e cola</span>
                </p>

                {/* Valor */}
                <div className="mb-4 text-center">
                  <span className="text-sm font-semibold text-foreground">
                    {"Valor no pix: "}
                  </span>
                  <span className="text-sm font-bold text-[#2d8c3c]">
                    {formatBRL(total + (upsellAdded ? upsellPrice : 0))}
                  </span>
                </div>

                {/* PIX Code Input */}
                <div className="mb-3 overflow-hidden rounded-lg border border-border bg-muted/50 px-4 py-3">
                  <p className="truncate text-xs font-mono text-foreground/70">
                    {pixCode}
                  </p>
                </div>

                {/* Copy Button */}
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d8c3c] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#236e30] active:scale-[0.98]"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copiado!" : "Copiar código pix"}
                </button>

                {/* Instructions */}
                <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
                  <h3 className="mb-3 text-center text-sm font-bold text-foreground">
                    Como pagar o seu pedido
                  </h3>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <ClipboardList className="mt-0.5 h-5 w-5 flex-shrink-0 text-foreground/50" />
                      <p className="text-xs leading-relaxed text-foreground/70">
                        <span className="font-bold text-foreground">{"Copie o código"}</span>
                        {" acima clicando no botão"}
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <Smartphone className="mt-0.5 h-5 w-5 flex-shrink-0 text-foreground/50" />
                      <p className="text-xs leading-relaxed text-foreground/70">
                        {"Abra o aplicativo de seu banco e selecione "}
                        <span className="font-bold text-foreground">Copia e Cola</span>
                        {" na opção de "}
                        <span className="font-bold text-foreground">pagamento por PIX</span>
                        {". Certifique-se que os dados estão corretos e finalize o pagamento."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* OR divider */}
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold text-foreground/40">OU</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Show QR Code Button */}
                <button
                  type="button"
                  onClick={() => setShowQrCode(!showQrCode)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d8c3c] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#236e30] active:scale-[0.98]"
                >
                  <QrCode className="h-4 w-4" />
                  {showQrCode ? "OCULTAR QR CODE" : "MOSTRAR QR CODE"}
                </button>

                {/* QR Code Display */}
                {showQrCode && (
                  <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-border bg-white p-6">
                    <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-border bg-white">
                      {/* Simple QR code placeholder using grid pattern */}
                      <svg viewBox="0 0 200 200" className="h-44 w-44" aria-label="QR Code PIX">
                        <rect width="200" height="200" fill="white" />
                        {/* Top-left finder */}
                        <rect x="10" y="10" width="50" height="50" fill="black" />
                        <rect x="15" y="15" width="40" height="40" fill="white" />
                        <rect x="20" y="20" width="30" height="30" fill="black" />
                        {/* Top-right finder */}
                        <rect x="140" y="10" width="50" height="50" fill="black" />
                        <rect x="145" y="15" width="40" height="40" fill="white" />
                        <rect x="150" y="20" width="30" height="30" fill="black" />
                        {/* Bottom-left finder */}
                        <rect x="10" y="140" width="50" height="50" fill="black" />
                        <rect x="15" y="145" width="40" height="40" fill="white" />
                        <rect x="20" y="150" width="30" height="30" fill="black" />
                        {/* Data pattern */}
                        <rect x="70" y="10" width="10" height="10" fill="black" />
                        <rect x="90" y="10" width="10" height="10" fill="black" />
                        <rect x="110" y="10" width="10" height="10" fill="black" />
                        <rect x="70" y="30" width="10" height="10" fill="black" />
                        <rect x="90" y="30" width="10" height="10" fill="black" />
                        <rect x="110" y="30" width="10" height="10" fill="black" />
                        <rect x="70" y="50" width="10" height="10" fill="black" />
                        <rect x="80" y="50" width="10" height="10" fill="black" />
                        <rect x="100" y="50" width="10" height="10" fill="black" />
                        <rect x="120" y="50" width="10" height="10" fill="black" />
                        <rect x="10" y="70" width="10" height="10" fill="black" />
                        <rect x="30" y="70" width="10" height="10" fill="black" />
                        <rect x="50" y="70" width="10" height="10" fill="black" />
                        <rect x="70" y="70" width="10" height="10" fill="black" />
                        <rect x="90" y="70" width="10" height="10" fill="black" />
                        <rect x="110" y="70" width="10" height="10" fill="black" />
                        <rect x="130" y="70" width="10" height="10" fill="black" />
                        <rect x="150" y="70" width="10" height="10" fill="black" />
                        <rect x="170" y="70" width="10" height="10" fill="black" />
                        <rect x="10" y="90" width="10" height="10" fill="black" />
                        <rect x="40" y="90" width="10" height="10" fill="black" />
                        <rect x="80" y="90" width="10" height="10" fill="black" />
                        <rect x="100" y="90" width="10" height="10" fill="black" />
                        <rect x="120" y="90" width="10" height="10" fill="black" />
                        <rect x="160" y="90" width="10" height="10" fill="black" />
                        <rect x="10" y="110" width="10" height="10" fill="black" />
                        <rect x="30" y="110" width="10" height="10" fill="black" />
                        <rect x="60" y="110" width="10" height="10" fill="black" />
                        <rect x="90" y="110" width="10" height="10" fill="black" />
                        <rect x="140" y="110" width="10" height="10" fill="black" />
                        <rect x="170" y="110" width="10" height="10" fill="black" />
                        <rect x="70" y="130" width="10" height="10" fill="black" />
                        <rect x="90" y="130" width="10" height="10" fill="black" />
                        <rect x="110" y="130" width="10" height="10" fill="black" />
                        <rect x="140" y="130" width="10" height="10" fill="black" />
                        <rect x="160" y="130" width="10" height="10" fill="black" />
                        <rect x="70" y="150" width="10" height="10" fill="black" />
                        <rect x="100" y="150" width="10" height="10" fill="black" />
                        <rect x="130" y="150" width="10" height="10" fill="black" />
                        <rect x="160" y="150" width="10" height="10" fill="black" />
                        <rect x="70" y="170" width="10" height="10" fill="black" />
                        <rect x="80" y="170" width="10" height="10" fill="black" />
                        <rect x="100" y="170" width="10" height="10" fill="black" />
                        <rect x="120" y="170" width="10" height="10" fill="black" />
                        <rect x="140" y="170" width="10" height="10" fill="black" />
                        <rect x="170" y="170" width="10" height="10" fill="black" />
                      </svg>
                    </div>
                    <p className="text-xs text-foreground/50">
                      {"Escaneie o QR Code com o aplicativo do seu banco"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Resumo (Desktop) */}
        <div className="hidden lg:block lg:w-72">
          <div className="sticky top-4 rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-base font-bold uppercase tracking-wide text-foreground">
              Resumo
            </h3>

            {/* Price Breakdown */}
            <div className="rounded-lg border border-border bg-muted/50 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/70">Produto</span>
                <span className="font-semibold text-foreground">
                  {formatBRL(subtotal)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-foreground/70">Frete</span>
                <span className={`font-semibold ${shippingCost === 0 ? "text-[#2d8c3c]" : "text-foreground"}`}>
                  {shippingCost === 0 ? "Gratis" : formatBRL(shippingCost)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-foreground/70">Desconto no PIX</span>
                <span className="font-semibold text-[#2d8c3c]">
                  -{formatBRL(pixDiscount)}
                </span>
              </div>
              <div className="mt-2 border-t border-border pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#2d8c3c]">Total</span>
                  <span className="text-lg font-extrabold text-[#2d8c3c]">
                    {formatBRL(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Product */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                <Image
                  src="/images/product.webp"
                  alt={kit.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {kit.name}
                </p>
                <p className="text-xs text-foreground/60">
                  Qtd.: {quantity} &nbsp;&nbsp; {formatBRL(kit.price)}
                </p>
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-3 flex items-center justify-center gap-4 rounded-lg bg-muted px-4 py-2">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-border"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center text-sm font-bold text-[#2d8c3c]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-border"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Remove */}
            <p className="mt-2 text-center text-xs text-[#2d8c3c] underline">
              <button type="button" onClick={() => setQuantity(1)}>
                Remover produto
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Footer: Formas de Pagamento */}
      <footer className="border-t border-border bg-card px-4 py-8 text-center">
        <h3 className="mb-4 text-base font-bold text-foreground">
          Formas de pagamento
        </h3>

        {/* Payment Brands */}
        <div className="mx-auto flex max-w-md items-center justify-center">
          <Image
            src="/images/formas-pagamento.png"
            alt="Formas de pagamento: American Express, Aura, Diners, Discover, Elo, Hiper, Hipercard, Mastercard, Visa, PIX"
            width={390}
            height={70}
            style={{ width: "auto", height: "auto" }}
          />
        </div>

        {/* Company Info */}
        <div className="mt-6 text-xs leading-relaxed text-foreground/50">
          <p>Copa do Mundo Panini 2026</p>
          <p>CNPJ: 30.278.428/0001-61</p>
          <p>Email: panini@sac.com.br</p>
        </div>

        {/* Security Badges */}
        <div className="mt-6 flex items-center justify-center gap-6">
          <Image
            src="/images/badge-seguro-ssl.png"
            alt="Seguro - Certificado SSL"
            width={120}
            height={40}
            style={{ width: "auto", height: "auto" }}
          />
          <Image
            src="/images/badge-pagamentos-seguros.png"
            alt="Pagamentos Seguros"
            width={120}
            height={40}
            style={{ width: "auto", height: "auto" }}
          />
        </div>
      </footer>
    </div>
  );
}
