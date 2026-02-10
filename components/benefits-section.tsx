import {
  CheckCircle,
  Clock,
  Shield,
  Truck,
  CreditCard,
  Gift,
} from "lucide-react";

const whyBuyReasons = [
  {
    icon: CheckCircle,
    title: "Desconto de 47% exclusivo",
    description: "Desconto exclusivo de pré-venda",
    color: "bg-[#2ecc71]",
  },
  {
    icon: Clock,
    title: "Entrega prioritária",
    description: "Receba antes do lançamento oficial",
    color: "bg-[#2ecc71]",
  },
  {
    icon: Shield,
    title: "Produto original Panini",
    description: "Álbum oficial 100% autêntico",
    color: "bg-[#2ecc71]",
  },
  {
    icon: Truck,
    title: "Frete Grátis",
    description: "Entrega grátis para todo o Brasil",
    color: "bg-[#2ecc71]",
  },
];

const paymentMethods = [
  {
    icon: CreditCard,
    title: "Pagamento seguro",
    description: "Cartão, boleto ou PIX",
  },
  {
    icon: Gift,
    title: "Embalagem especial",
    description: "Produto protegido para entrega",
  },
];

export function BenefitsSection() {
  return (
    <section className="px-4 py-8">
      <h2 className="mb-6 text-center text-xl font-bold text-foreground sm:text-2xl">
        Por que garantir seu kit agora?
      </h2>

      <div className="flex flex-col gap-3">
        {whyBuyReasons.map((reason) => (
          <div
            key={reason.title}
            className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm"
          >
            <div
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${reason.color}`}
            >
              <reason.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {reason.title}
              </h3>
              <p className="text-sm text-foreground/60">
                {reason.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
