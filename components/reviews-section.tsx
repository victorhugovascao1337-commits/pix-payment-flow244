import { Star, CheckCircle } from "lucide-react";
import Image from "next/image";

const reviews = [
  {
    name: "Carlos Silva",
    location: "São Paulo - SP",
    title: "Chegou super rápido!",
    text: "Comprei na pré-venda da Copa passada e foi incrível. Chegou antes do lançamento oficial e consegui começar a coleção antes de todo mundo. Super recomendo!",
    days: 2,
    photo: "/images/review-2.jpg",
  },
  {
    name: "Amanda Costa",
    location: "Rio de Janeiro - RJ",
    title: "Melhor preço que encontrei",
    text: "Pesquisei em vários lugares e aqui foi onde encontrei o melhor preço. Ainda veio com frete grátis! Meu filho ficou muito feliz com o álbum.",
    days: 3,
    photo: "/images/review-1.png",
  },
  {
    name: "Roberto Almeida",
    location: "Belo Horizonte - MG",
    title: "Produto original garantido",
    text: "Tinha medo de comprar online e vir produto falsificado, mas veio tudo original com selo da Panini. Álbum de excelente qualidade e figurinhas perfeitas.",
    days: 4,
    photo: "/images/review-3.jpg",
  },
  {
    name: "Fernanda Lima",
    location: "Curitiba - PR",
    title: "Ótima experiência",
    text: "Comprei o kit completo e valeu muito a pena. Com 90 pacotes consegui avançar bastante na coleção. Atendimento excelente e entrega dentro do prazo.",
    days: 5,
    photo: "/images/review-4.jpg",
  },
  {
    name: "Marcos Santos",
    location: "Porto Alegre - RS",
    title: "Vou comprar de novo",
    text: "Já é a segunda vez que compro aqui. Sempre chega tudo certinho e bem embalado. Preço justo e frete grátis fazem toda a diferença. Recomendo!",
    days: 6,
    photo: "/images/review-5.jpg",
  },
];

function StarRating() {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="h-4 w-4 fill-[#f1c40f] text-[#f1c40f]"
        />
      ))}
    </div>
  );
}

export function ReviewsSection() {
  return (
    <section className="px-4 py-8">
      <h2 className="mb-6 text-center text-xl font-bold text-foreground sm:text-2xl">
        O que nossos clientes dizem
      </h2>

      <div className="flex flex-col gap-4">
        {reviews.map((review) => (
          <div
            key={review.name}
            className="rounded-xl bg-card p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={review.photo || "/placeholder.svg"}
                    alt={review.name}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {review.name}
                  </p>
                  <p className="text-xs text-foreground/50">
                    {review.location}
                  </p>
                </div>
              </div>
              <StarRating />
            </div>
            <h4 className="mb-2 text-sm font-bold text-foreground">
              {review.title}
            </h4>
            <p className="mb-3 text-sm leading-relaxed text-foreground/70">
              {review.text}
            </p>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#2ecc71]" />
              <span className="text-xs font-semibold text-[#2ecc71]">
                Compra verificada
              </span>
              <span className="text-xs text-foreground/40">
                {review.days} dias {"atrás"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
