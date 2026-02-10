import Image from "next/image";
import { Lock } from "lucide-react";

export function FooterSection() {
  return (
    <footer className="flex flex-col items-center gap-3 px-4 py-8 text-center">
      <Image
        src="/images/logo-panini-256.png"
        alt="Panini Logo"
        width={140}
        height={50}
        style={{ width: "auto", height: "auto" }}
        className="mb-2"
      />
      <div className="flex items-center gap-1.5">
        <Lock className="h-4 w-4 text-[#2ecc71]" />
        <p className="text-sm font-semibold text-[#2ecc71]">
          Compra 100% Segura
        </p>
      </div>
      <div className="mt-2 text-xs leading-relaxed text-foreground/50">
        <p>Panini Brasil Ltda. &middot; CNPJ 58.732.058/0001-00</p>
        <p>
          Alameda Caiapos, 425 &middot; Tambore/SP &middot; 06460-110
        </p>
      </div>
    </footer>
  );
}
