import Image from "next/image";

export function HeroSection() {
  return (
    <section className="flex flex-col items-center px-4 pb-8 pt-4 text-center">
      <Image
        src="/images/fifa26.png"
        alt="FIFA World Cup 2026 Logo"
        width={120}
        height={150}
        className="mb-4"
        style={{ width: "auto", height: "auto" }}
        priority
      />
      <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-foreground/70">
        {"Álbum Oficial"}
      </p>
      <p className="mb-2 text-xs text-foreground/60">
        EUA &middot; {"Canadá"} &middot; {"México"}
      </p>
      <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        COPA 2026
      </h1>
      <p className="mb-2 text-base leading-relaxed text-foreground/80">
        O maior evento do futebol mundial {"está"} chegando!
      </p>
      <p className="mb-2 text-base leading-relaxed text-foreground/80">
        Garanta seu {"álbum"} de capa dura com{" "}
        <strong className="text-foreground">30, 60 ou 90 pacotes</strong>.
      </p>
      <p className="mt-2 text-lg font-bold text-foreground">
        Apenas 5.000 unidades {"disponíveis"} para o Brasil!
      </p>

      {/* Product image */}
      <div className="mt-6 w-full overflow-hidden rounded-2xl">
        <Image
          src="/images/product.webp"
          alt="Kit Album Copa do Mundo 2026 com caixas de figurinhas e pacotes"
          width={800}
          height={600}
          className="h-auto w-full object-cover"
        />
      </div>
    </section>
  );
}
