"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronRight } from "lucide-react";

const faqs = [
  {
    question: "Quando meu pedido será entregue?",
    answer:
      "Os pedidos são enviados em até 3 dias úteis após a confirmação do pagamento. O prazo de entrega varia conforme a região, mas em média leva de 5 a 10 dias úteis.",
  },
  {
    question: "As figurinhas e o álbum são originais?",
    answer:
      "Sim! Todos os nossos produtos são 100% originais Panini, com selo de autenticidade. Trabalhamos diretamente com a distribuidora oficial.",
  },
  {
    question: "Posso escolher quais figurinhas vou receber?",
    answer:
      "Não, as figurinhas vêm em pacotes lacrados originais da Panini. Cada pacote contém figurinhas aleatórias, como em qualquer ponto de venda autorizado.",
  },
  {
    question: "E se eu receber figurinhas repetidas?",
    answer:
      "Figurinhas repetidas fazem parte da experiência de colecionar! Você pode trocar com amigos ou em grupos de troca online. Quanto mais pacotes, mais chances de completar o álbum.",
  },
  {
    question: "O frete é realmente grátis?",
    answer:
      "Sim! O frete é 100% grátis para todo o Brasil em todos os nossos kits. Você não paga nada a mais pela entrega.",
  },
  {
    question: "Quais formas de pagamento são aceitas?",
    answer:
      "Aceitamos PIX, cartão de crédito (em até 12x), cartão de débito e boleto bancário. O desconto especial é válido para pagamento via PIX.",
  },
  {
    question: "Posso cancelar meu pedido?",
    answer:
      "Sim, você pode solicitar o cancelamento em até 7 dias após a compra, conforme o Código de Defesa do Consumidor. Basta entrar em contato com nosso suporte.",
  },
];

export function FAQSection() {
  return (
    <section className="px-4 py-8">
      <h2 className="mb-6 text-center text-xl font-bold text-foreground sm:text-2xl">
        {"Dúvidas Frequentes"}
      </h2>

      <Accordion type="single" collapsible className="flex flex-col gap-3">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="overflow-hidden rounded-xl border bg-card shadow-sm"
          >
            <AccordionTrigger className="gap-2 px-4 py-4 text-left text-sm font-semibold text-foreground hover:no-underline [&>svg:last-child]:hidden">
              <span className="flex-1">{faq.question}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-foreground/40 transition-transform duration-200 [[data-state=open]_&]:rotate-90" />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 text-sm leading-relaxed text-foreground/70">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
