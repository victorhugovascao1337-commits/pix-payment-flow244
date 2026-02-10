"use client";

import { useEffect } from "react";
import Image from "next/image";
import { CheckCircle2, Package, Mail, Clock } from "lucide-react";
import { trackFacebookPurchase } from "@/lib/facebook/facebook-client";

export default function ThankYouPage() {
    useEffect(() => {
        // Track Facebook Purchase event
        trackFacebookPurchase(119.9, "BRL", "Álbum Panini Copa 2026");

        console.log("[OBRIGADO] 🎉 Página de agradecimento carregada");
    }, []);

    return (
        <main className="mx-auto min-h-screen w-full max-w-md bg-gradient-to-b from-green-50 to-white">
            {/* Header - Panini Logo */}
            <header className="flex items-center justify-center bg-white px-4 py-6 shadow-sm">
                <Image
                    src="/images/logo-panini-256.png"
                    alt="Panini Logo"
                    width={150}
                    height={54}
                    style={{ width: "auto", height: "auto" }}
                    priority
                />
            </header>

            {/* Success Message */}
            <div className="px-6 py-8 text-center">
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full bg-green-100 p-4">
                        <CheckCircle2 className="h-16 w-16 text-green-600" />
                    </div>
                </div>

                <h1 className="mb-3 text-3xl font-bold text-gray-900">
                    Pagamento Confirmado!
                </h1>

                <p className="mb-8 text-lg text-gray-600">
                    Obrigado pela sua compra! 🎉
                </p>

                {/* Order Info Card */}
                <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg">
                    <h2 className="mb-4 text-xl font-semibold text-gray-900">
                        Seu pedido está confirmado
                    </h2>

                    <div className="space-y-4 text-left">
                        <div className="flex items-start gap-3">
                            <Package className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                            <div>
                                <p className="font-semibold text-gray-900">Álbum Panini Copa 2026</p>
                                <p className="text-sm text-gray-600">
                                    Seu álbum será enviado em breve
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Mail className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                            <div>
                                <p className="font-semibold text-gray-900">Confirmação por e-mail</p>
                                <p className="text-sm text-gray-600">
                                    Enviamos todos os detalhes para seu e-mail
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Clock className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                            <div>
                                <p className="font-semibold text-gray-900">Prazo de entrega</p>
                                <p className="text-sm text-gray-600">
                                    Receba em até 7 dias úteis via Correios
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Image */}
                <div className="mb-8">
                    <Image
                        src="/images/product.webp"
                        alt="Álbum Panini Copa 2026"
                        width={300}
                        height={300}
                        className="mx-auto rounded-2xl shadow-lg"
                        style={{ width: "auto", height: "auto" }}
                    />
                </div>

                {/* Additional Info */}
                <div className="rounded-xl bg-blue-50 p-6 text-left">
                    <h3 className="mb-3 font-semibold text-blue-900">
                        📦 Próximos passos
                    </h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                        <li>✓ Você receberá um e-mail de confirmação</li>
                        <li>✓ Seu pedido será processado em até 24h</li>
                        <li>✓ Você receberá o código de rastreio por e-mail</li>
                        <li>✓ Entrega em até 7 dias úteis</li>
                    </ul>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-white px-6 py-8 text-center">
                <p className="mb-2 text-sm font-semibold text-gray-900">
                    Dúvidas? Entre em contato
                </p>
                <p className="text-sm text-gray-600">
                    suporte@panini.com.br
                </p>
                <p className="mt-6 text-xs text-gray-500">
                    © 2026 Panini. Todos os direitos reservados.
                </p>
            </footer>
        </main>
    );
}
