import { BookOpen, Layers, Package, Globe } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "112 Páginas",
    description: "O maior álbum já produzido",
    color: "bg-[#e74c3c]",
  },
  {
    icon: Layers,
    title: "980 Figurinhas",
    description: "Coleção completa mais extensa",
    color: "bg-[#e67e22]",
  },
  {
    icon: Package,
    title: "7 Figurinhas por Pacote",
    description: "Maior chance de figurinhas cromadas",
    color: "bg-[#f1c40f]",
  },
  {
    icon: Globe,
    title: "48 Seleções",
    description: "Todas as equipes classificadas",
    color: "bg-[#2ecc71]",
  },
];

const historicFacts = [
  "Primeira Copa do Mundo com 48 seleções",
  "Álbum com 112 páginas - recorde histórico",
  "Três países-sede: EUA, Canadá e México",
];

export function AboutSection() {
  return (
    <section className="px-4 py-8">
      <h2 className="mb-1 text-center text-xl font-bold text-foreground sm:text-2xl">
        {"Sobre o Álbum Oficial"}
      </h2>
      <p className="mb-6 text-center text-xs text-foreground/60 sm:text-sm">
        {"O maior álbum da história da Copa do Mundo"}
      </p>

      <div className="flex flex-col gap-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm"
          >
            <div
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${feature.color}`}
            >
              <feature.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-foreground/60">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Edicao Historica */}
      <div className="mt-6 rounded-xl bg-[#fef9e7] p-6">
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="text-xl">&#11088;</span>
          <h3 className="text-lg font-bold text-foreground">
            {"Edição Histórica"}
          </h3>
        </div>
        <ul className="flex flex-col gap-3">
          {historicFacts.map((fact) => (
            <li key={fact} className="flex items-start gap-2">
              <span className="mt-0.5 text-sm">&#11088;</span>
              <p className="text-sm leading-relaxed text-foreground/80">
                {fact}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
